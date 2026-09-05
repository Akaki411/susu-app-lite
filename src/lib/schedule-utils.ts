'use client'

import type {ScheduleEvent} from '@/shared/types'

export const DOW_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
const MONTHS_FULL = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

export const toKey = (d: Date): string => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
};

export const parseKey = (key: string): Date => {
    const [y, m, d] = key.split('-').map(Number)
    return new Date(y!, (m ?? 1) - 1, d ?? 1)
};

export const addDays = (d: Date, n: number): Date => {
    const x = new Date(d)
    x.setDate(x.getDate() + n)
    return x
};

export const mondayOf = (d: Date): Date => {
    const x = new Date(d)
    const wd = (x.getDay() + 6) % 7 // Пн=0 … Вс=6
    x.setDate(x.getDate() - wd)
    x.setHours(0, 0, 0, 0)
    return x
};

export const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const fmtShort = (d: Date): string => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;

export const fmtLong = (d: Date): string => `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;

export const isoWeek = (d: Date): number => {
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
    for (const e of events) {
        const list = map.get(e.date)
        if (list) list.push(e)
        else map.set(e.date, [e])
    }
    for (const list of map.values()) list.sort((a, b) => a.beginTime.localeCompare(b.beginTime))
    return map
};

const timeToMin = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
};

export const isPairNow = (event: ScheduleEvent, dateKey: string, now: Date): boolean => {
    if (dateKey !== toKey(now)) return false
    const cur = now.getHours() * 60 + now.getMinutes()
    return cur >= timeToMin(event.beginTime) && cur < timeToMin(event.endTime)
};
