'use client'
// Сравнение двух версий расписания по дням - для уведомления об изменениях

import {groupByDate} from './schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

export interface DayDiff {
    date: string
    before: ScheduleEvent[]
    after: ScheduleEvent[]
}

const eventKey = (e: ScheduleEvent): string =>
    [
        e?.beginTime ?? '',
        e?.endTime ?? '',
        e?.subject ?? '',
        e?.eventType ?? '',
        e?.room ?? '',
        e?.teacher ?? '',
        Array.isArray(e?.groups) ? [...e.groups].sort().join(',') : '',
    ].join('␟')

const byTime = (a: ScheduleEvent, b: ScheduleEvent): number =>
    String(a?.beginTime || '').localeCompare(String(b?.beginTime || ''))

const sameDayEvents = (a: ScheduleEvent[], b: ScheduleEvent[]): boolean => {
    if (a.length !== b.length) return false
    const ak = [...a].sort(byTime).map(eventKey)
    const bk = [...b].sort(byTime).map(eventKey)
    return ak.every((k, i) => k === bk[i])
};

export const diffSchedules = (before: ScheduleEvent[], after: ScheduleEvent[]): DayDiff[] => {
    const byBefore = groupByDate(Array.isArray(before) ? before : [])
    const byAfter = groupByDate(Array.isArray(after) ? after : [])
    const dates = new Set<string>([...byBefore.keys(), ...byAfter.keys()])

    const diffs: DayDiff[] = []
    for (const date of dates) {
        const b = byBefore.get(date) ?? []
        const a = byAfter.get(date) ?? []
        if (sameDayEvents(b, a)) continue
        diffs.push({
            date,
            before: [...b].sort(byTime),
            after: [...a].sort(byTime),
        })
    }
    return diffs.sort((x, y) => x.date.localeCompare(y.date))
};
