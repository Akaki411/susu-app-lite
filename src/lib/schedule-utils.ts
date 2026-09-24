'use client'

import type {ScheduleEvent} from '@/shared/types'

export const DOW_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS_FULL = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

export const toKey = (d: Date): string => {
    if (!(d instanceof Date) || isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
};

export const parseKey = (key: string): Date => {
    if (!key || typeof key !== 'string') return new Date()
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
};

export const addDays = (d: Date, n: number): Date => {
    const x = d instanceof Date && !isNaN(d.getTime()) ? new Date(d) : new Date()
    x.setDate(x.getDate() + n)
    return x
};

export const mondayOf = (d: Date): Date => {
    const x = d instanceof Date && !isNaN(d.getTime()) ? new Date(d) : new Date()
    const wd = (x.getDay() + 6) % 7 // Пн=0 … Вс=6
    x.setDate(x.getDate() - wd)
    x.setHours(0, 0, 0, 0)
    return x
};

export const sameDay = (a?: Date | null, b?: Date | null): boolean => {
    if (!a || !b) return false
    if (!(a instanceof Date) || !(b instanceof Date)) return false
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
};

export const fmtShort = (d: Date): string => {
    if (!(d instanceof Date) || isNaN(d.getTime())) return ''
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()] ?? ''}`
};

export const fmtLong = (d: Date): string => {
    if (!(d instanceof Date) || isNaN(d.getTime())) return ''
    return `${d.getDate()} ${MONTHS_FULL[d.getMonth()] ?? ''}`
};

export const isoWeek = (d: Date): number => {
    if (!(d instanceof Date) || isNaN(d.getTime())) return 1
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = (date.getUTCDay() + 6) % 7
    date.setUTCDate(date.getUTCDate() - dayNum + 3)
    const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
    const diff = date.getTime() - firstThursday.getTime()
    return 1 + Math.round(diff / (7 * 86400000))
};

export const weekParity = (d: Date): 'I' | 'II' => isoWeek(d) % 2 === 1 ? 'I' : 'II';

export const groupByDate = (events: ScheduleEvent[]): Map<string, ScheduleEvent[]> => {
    const map = new Map<string, ScheduleEvent[]>()
    if (!Array.isArray(events)) return map
    for (const e of events) {
        if (!e || typeof e.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.date)) continue
        const list = map.get(e.date)
        if (list) list.push(e)
        else map.set(e.date, [e])
    }
    for (const list of map.values()) {
        list.sort((a, b) => String(a?.beginTime || '').localeCompare(String(b?.beginTime || '')))
    }
    return map
};

const timeToMin = (hhmm: unknown): number => {
    if (typeof hhmm !== 'string' || !hhmm) return 0
    const [h, m] = hhmm.split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
    return (h ?? 0) * 60 + (m ?? 0)
};

export const isPairNow = (event: ScheduleEvent, dateKey: string, now: Date): boolean => {
    if (!event || dateKey !== toKey(now)) return false
    const begin = timeToMin(event.beginTime)
    const end = timeToMin(event.endTime)
    if (begin === 0 && end === 0) return false
    const cur = now.getHours() * 60 + now.getMinutes()
    return cur >= begin && cur < end
};

export type PairCategory = 'lecture' | 'practice' | 'lab' | 'exam' | 'other'

export const pairCategoryOf = (eventType: unknown): PairCategory => {
    if (typeof eventType !== 'string' || !eventType) return 'other'
    const t = eventType.toLowerCase()
    if (t.includes('лекц')) return 'lecture'
    if (t.includes('лаборатор')) return 'lab'
    if (t.includes('экзамен') || t.includes('зачет') || t.includes('зачёт')) return 'exam'
    if (t.includes('практ') || t.includes('семинар')) return 'practice'
    return 'other'
};

const AUTO_SWITCH_GRACE_MIN = 60

export const smartInitialDate = (byDate: Map<string, ScheduleEvent[]>, now: Date): Date => {
    const todayKey = toKey(now)
    const todayEvents = byDate.get(todayKey) ?? []
    if (todayEvents.length > 0) {
        const lastEnd = todayEvents.reduce((max, e) => Math.max(max, timeToMin(e?.endTime)), 0)
        const nowMin = now.getHours() * 60 + now.getMinutes()
        if (nowMin < lastEnd + AUTO_SWITCH_GRACE_MIN) return now
    }

    let nextKey: string | null = null
    for (const k of byDate.keys()) {
        if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(k)) continue
        if (k > todayKey && (nextKey === null || k < nextKey)) nextKey = k
    }
    if (nextKey) {
        const parsed = parseKey(nextKey)
        if (!isNaN(parsed.getTime())) return parsed
    }

    let prevKey: string | null = null
    for (const k of byDate.keys()) {
        if (!k || !/^\d{4}-\d{2}-\d{2}$/.test(k)) continue
        if (k <= todayKey && (prevKey === null || k > prevKey)) prevKey = k
    }
    if (prevKey) {
        const parsed = parseKey(prevKey)
        if (!isNaN(parsed.getTime())) return parsed
    }
    return now
};
