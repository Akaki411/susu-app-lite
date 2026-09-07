// Аналитика по авторизованным пользователям и использованию настроек.
//
// Два разных инструмента для двух разных задач:
//  - HLL - там, где нужно знать сколько разных людей
//  - простые счётчики - там, где нужно знать сколько раз выбрали конкретное значение

import {HyperLogLog} from './hll'
import {db} from './db/sqlite'

const BATCH_INTERVAL_MS = 15_000

const HLL_IDS = [
    'auth:student',
    'auth:instructor',
    'auth:other',
    'device:desktop',
    'device:mobile',
    'appearance:changers',
] as const
export type HllId = (typeof HLL_IDS)[number]

type AnalyticsGlobals = typeof globalThis & {
    __susuHlls?: Map<HllId, HyperLogLog>
    __susuDirtyHlls?: Set<HllId>
    __susuCounterDeltas?: Map<string, number>
}
const g = globalThis as AnalyticsGlobals
const hlls = (g.__susuHlls ??= new Map<HllId, HyperLogLog>())
const dirtyHlls = (g.__susuDirtyHlls ??= new Set<HllId>())

const loadHll = (id: HllId): HyperLogLog => {
    let h = hlls.get(id)
    if (h) return h
    const row = db.prepare('SELECT sketch FROM analytics_hll WHERE id = ?').get(id) as { sketch: string } | undefined
    h = row ? HyperLogLog.deserialize(row.sketch) : new HyperLogLog()
    hlls.set(id, h)
    return h
}

export const addToHll = (id: HllId, value: string): void => {
    if (!value) return
    loadHll(id).add(value)
    dirtyHlls.add(id)
}

export const countHll = (id: HllId): number => loadHll(id).count()

const counterDeltas = (g.__susuCounterDeltas ??= new Map<string, number>())

export const incrementCounter = (category: string, key: string): void => {
    const k = `${category}:${key}`
    counterDeltas.set(k, (counterDeltas.get(k) ?? 0) + 1)
}

export const getCounters = (category: string): Record<string, number> => {
    const rows = db.prepare('SELECT key, count FROM analytics_counters WHERE category = ?').all(category) as Array<{
        key: string
        count: number
    }>
    return Object.fromEntries(rows.map((r) => [r.key, r.count]))
}

const flush = (): void => {
    for (const id of dirtyHlls) {
        dirtyHlls.delete(id)
        const sketch = hlls.get(id)
        if (!sketch) continue
        db.prepare(
            `INSERT INTO analytics_hll (id, sketch, updatedAt)
             VALUES (?, ?, ?) ON CONFLICT(id) DO
            UPDATE SET sketch = excluded.sketch, updatedAt = excluded.updatedAt`,
        ).run(id, sketch.serialize(), new Date().toISOString())
    }

    for (const [k, delta] of counterDeltas) {
        counterDeltas.delete(k)
        if (!delta) continue
        const sep = k.indexOf(':')
        const category = k.slice(0, sep)
        const key = k.slice(sep + 1)
        db.prepare(
            `INSERT INTO analytics_counters (category, key, count)
             VALUES (?, ?, ?) ON CONFLICT(category, key) DO
            UPDATE SET count = count + excluded.count`,
        ).run(category, key, delta)
    }
}

if (!(globalThis as unknown as { __susuAnalyticsFlusher?: boolean }).__susuAnalyticsFlusher) {
    setInterval(() => {
        try {
            flush()
        } catch {
        }
    }, BATCH_INTERVAL_MS).unref?.()
    ;(globalThis as unknown as { __susuAnalyticsFlusher?: boolean }).__susuAnalyticsFlusher = true
}

export const roleBucketFor = (role: string | null | undefined): 'auth:student' | 'auth:instructor' | 'auth:other' => {
    const r = (role ?? '').toLowerCase()
    if (r.includes('stud')) return 'auth:student'
    if (r.includes('teach') || r.includes('instruct') || r.includes('prepod') || r.includes('lecturer')) return 'auth:instructor'
    return 'auth:other'
};

export const deviceBucketFor = (userAgent: string | null): 'device:desktop' | 'device:mobile' => {
    const isMobile = !!userAgent && /android|iphone|ipad|ipod|mobile/i.test(userAgent)
    return isMobile ? 'device:mobile' : 'device:desktop'
};

export interface SettingsUsage {
    theme: Record<string, number>
    passButtonMode: Record<string, number>
    tileResize: Record<string, number>
    notifications: Record<string, number>
    feedEnabled: Record<string, number>
    language: Record<string, number>
}

export const getAnalyticsSummary = () => {
    const student = countHll('auth:student')
    const instructor = countHll('auth:instructor')
    const other = countHll('auth:other')
    const settingsUsage: SettingsUsage = {
        theme: getCounters('theme'),
        passButtonMode: getCounters('passButtonMode'),
        tileResize: getCounters('tileResize'),
        notifications: getCounters('notifications'),
        feedEnabled: getCounters('feedEnabled'),
        language: getCounters('language'),
    }
    return {
        authUsers: {student, instructor, other, total: student + instructor + other},
        appearanceChangers: countHll('appearance:changers'),
        devices: {desktop: countHll('device:desktop'), mobile: countHll('device:mobile')},
        settingsUsage,
    }
};
