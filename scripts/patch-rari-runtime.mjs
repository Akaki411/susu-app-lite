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

restoreReactCompilerRuntime()
patchRariFiles()
patchReactVirtualFlushSync()
patchGetClientComponentPathGuard()
