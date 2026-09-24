import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const MARKER = '__rariMemoRef'

const replacement = name => (
    `import{useRef as ${MARKER}}from"react";` +
    `const ${name}=function(__n){const __r=${MARKER}(null);let __c=__r.current;` +
    `if(__c===null){__c=new Array(__n);for(let __i=0;__i<__n;__i++)__c[__i]=Symbol.for("react.memo_cache_sentinel");__r.current=__c;}` +
    `return __c;};`
);

const IMPORT_RE = /import\s*\{\s*c(?:\s+as\s+(\w+))?\s*\}\s*from\s*(["'])react\/compiler-runtime\2;?/g

const patchRariFiles = () => {
    let rariDist
    try {
        rariDist = join(require.resolve('rari/package.json'), '..', 'dist')
    } catch {
        console.warn('[patch] пакет rari не найден — пропускаем')
        return
    }

    const patched = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry)
            if (statSync(full).isDirectory()) {
                walk(full)
                continue
            }
            if (!full.endsWith('.mjs')) continue
            const src = readFileSync(full, 'utf-8')
            if (!src.includes('react/compiler-runtime')) continue
            if (src.includes(MARKER)) continue
            const next = src.replace(IMPORT_RE, (_m, alias) => replacement(alias ?? 'c'))
            if (next !== src) {
                writeFileSync(full, next, 'utf-8')
                patched.push(full)
            }
        }
    }
    walk(rariDist)

    if (patched.length) {
        for (const f of patched) console.warn(`[patch] rari: инлайн c() → ${f}`)
    } else {
        console.warn('[patch] rari: файлы для патча не найдены (уже пропатчены?)')
    }
};

const restoreReactCompilerRuntime = () => {
    let target
    try {
        target = require.resolve('react/compiler-runtime')
    } catch {
        return
    }
    const current = readFileSync(target, 'utf-8')
    if (!current.includes('PATCHED by scripts/patch-rari-runtime.mjs')) return
    const original = `'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-compiler-runtime.production.js');
} else {
  module.exports = require('./cjs/react-compiler-runtime.development.js');
}
`
    writeFileSync(target, original, 'utf-8')
    console.warn('[patch] react/compiler-runtime восстановлен в исходный CJS')
};


const patchReactVirtualFlushSync = () => {
    let file
    try {
        file = join(require.resolve('@tanstack/react-virtual/package.json'), '..', 'dist/esm/index.js')
    } catch {
        console.warn('[patch] @tanstack/react-virtual не найден — пропускаем')
        return
    }
    const src = readFileSync(file, 'utf-8')
    const MARKER = '__rariFlushSyncFallback'
    if (src.includes(MARKER)) return
    const IMPORT_LINE = 'import { flushSync } from "react-dom";'
    if (!src.includes(IMPORT_LINE)) {
        console.warn('[patch] @tanstack/react-virtual: строка импорта flushSync не найдена (версия изменилась?)')
        return
    }
    const next = src.replace(
        IMPORT_LINE,
        `import * as ${MARKER}_ns from "react-dom";` +
        `const flushSync=${MARKER}_ns.flushSync||((fn)=>fn());`,
    )
    writeFileSync(file, next, 'utf-8')
    console.warn(`[patch] @tanstack/react-virtual: flushSync → безопасный namespace-импорт (${file})`)
};

const patchGetClientComponentPathGuard = () => {
    let rariDist
    try {
        rariDist = join(require.resolve('rari/package.json'), '..', 'dist')
    } catch {
        return
    }
    const OLD = 'find(t=>t.path!==``&&u(t.path,e))'
    const NEW = 'find(t=>t.path!=null&&t.path!==``&&u(t.path,e))'
    const patched = []
    const walk = (dir) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry)
            if (statSync(full).isDirectory()) {
                walk(full)
                continue
            }
            if (!full.endsWith('.mjs')) continue
            const src = readFileSync(full, 'utf-8')
            if (!src.includes(OLD)) continue
            writeFileSync(full, src.replace(OLD, NEW), 'utf-8')
            patched.push(full)
        }
    }
    walk(rariDist)
    if (patched.length) {
        for (const f of patched) console.warn(`[patch] rari: guard undefined path in get-client-component → ${f}`)
    }
};

const UTF8_BYTE_LENGTH_FN = `function __rariUtf8ByteLength(str){let len=0;for(let i=0;i<str.length;i++){const code=str.charCodeAt(i);if(code<0x80)len+=1;else if(code<0x800)len+=2;else if(code>=0xD800&&code<=0xDBFF){len+=4;i++;}else len+=3;}return len;}\n`

const patchRedisEncoderBufferByteLength = () => {
    let file
    try {
        file = join(require.resolve('@redis/client/package.json'), '..', 'dist/lib/RESP/encoder.js')
    } catch {
        console.warn('[patch] @redis/client не найден — пропускаем')
        return
    }
    const src = readFileSync(file, 'utf-8')
    const MARKER = '__rariUtf8ByteLength'
    if (src.includes(MARKER)) {
        console.warn('[patch] @redis/client: уже пропатчен')
        return
    }
    const CALL_OLD = "'$' + Buffer.byteLength(arg) + CRLF + arg + CRLF;"
    const CALL_NEW = "'$' + __rariUtf8ByteLength(arg) + CRLF + arg + CRLF;"
    const CONST_OLD = "const CRLF = '\\r\\n';"
    if (!src.includes(CALL_OLD) || !src.includes(CONST_OLD)) {
        console.warn('[patch] @redis/client: исходная строка не найдена (версия изменилась?)')
        return
    }

    const withHelper = src.replace(CONST_OLD, () => CONST_OLD + '\n' + UTF8_BYTE_LENGTH_FN)
    const patched = withHelper.replace(CALL_OLD, () => CALL_NEW)
    writeFileSync(file, patched, 'utf-8')
    console.warn(`[patch] @redis/client: Buffer.byteLength → чистый JS UTF-8 counter (${file})`)
};

const patchRedisScheduleWriteSetImmediate = () => {
    let file
    try {
        file = join(require.resolve('@redis/client/package.json'), '..', 'dist/lib/client/index.js')
    } catch {
        console.warn('[patch] @redis/client (client/index.js) не найден — пропускаем')
        return
    }
    const src = readFileSync(file, 'utf-8')
    const MARKER = '__rariScheduledWriteCb'
    if (src.includes(MARKER)) {
        console.warn('[patch] @redis/client: setImmediate уже пропатчен')
        return
    }
    const OLD = `this.#scheduledWrite = setImmediate(() => {
            this.#write();
            this.#scheduledWrite = undefined;
        });`
    const NEW = `const ${MARKER} = () => {
            this.#write();
            this.#scheduledWrite = undefined;
        };
        try {
            this.#scheduledWrite = setImmediate(${MARKER});
        }
        catch {
            this.#scheduledWrite = setTimeout(${MARKER}, 0);
        }`
    if (!src.includes(OLD)) {
        console.warn('[patch] @redis/client: исходная строка #scheduleWrite не найдена (версия изменилась?)')
        return
    }
    writeFileSync(file, src.replace(OLD, () => NEW), 'utf-8')
    console.warn(`[patch] @redis/client: #scheduleWrite setImmediate → try/catch с setTimeout fallback (${file})`)
};

restoreReactCompilerRuntime()
patchRariFiles()
patchReactVirtualFlushSync()
patchGetClientComponentPathGuard()
patchRedisEncoderBufferByteLength()
patchRedisScheduleWriteSetImmediate()
