'use client'
// Полоса дней над расписанием по датам. Горизонтальный скролл по неделям

import {useLayoutEffect, useRef} from 'react'
import {DayDots} from './day-dots.tsx'
import {addDays, DOW_SHORT, mondayOf, sameDay, toKey} from '@/lib/schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

const WeekPage = ({
    monday,
    pivot,
    now,
    getPairs,
    onPick
}: {
    monday: Date
    pivot: Date
    now: Date
    getPairs: (d: Date) => ScheduleEvent[]
    onPick: (d: Date) => void
}) => (
    <div className="week-strip__page">
        {Array.from({length: 7}, (_, i) => addDays(monday, i)).map((d, i) => {
            const active = sameDay(d, pivot)
            const weekend = i === 5 || i === 6
            return (
                <div
                    key={toKey(d)}
                    onClick={() => onPick(d)}
                    className={`schedule__day${weekend ? ' schedule__day--weekend' : ''}`}
                >
                    <span className="schedule__day-dow">{DOW_SHORT[i]}</span>
                    <span
                        className={`schedule__day-num${active ? ' schedule__day-num--active' : ''}`}>{d.getDate()}</span>
                    <DayDots pairs={getPairs(d)} dateKey={toKey(d)} now={now}/>
                </div>
            )
        })}
    </div>
)

export const WeekStrip = ({
    pivot,
    now,
    getPairs,
    onPick,
    onWeekShift
}: {
    pivot: Date
    now: Date
    getPairs: (d: Date) => ScheduleEvent[]
    onPick: (d: Date) => void
    onWeekShift: (dir: 1 | -1) => void
}) => {
    const trackRef = useRef<HTMLDivElement | null>(null)
    const suppressRef = useRef(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const monday = mondayOf(pivot)

    useLayoutEffect(() => {
        const el = trackRef.current
        if (!el) return
        if (timerRef.current) clearTimeout(timerRef.current)
        suppressRef.current = true
        el.scrollLeft = el.clientWidth
        const id = requestAnimationFrame(() => {
            suppressRef.current = false
        })
        return () => cancelAnimationFrame(id)
    }, [monday.getTime()])

    const onScroll = () => {
        if (suppressRef.current) return
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const el = trackRef.current
            if (!el || el.clientWidth === 0) return
            const page = Math.round(el.scrollLeft / el.clientWidth)
            if (page === 1) return
            onWeekShift(page === 0 ? -1 : 1)
        }, 100)
    }

    return (
        <div ref={trackRef} onScroll={onScroll} className="week-strip">
            <WeekPage monday={addDays(monday, -7)} pivot={pivot} now={now} getPairs={getPairs} onPick={onPick}/>
            <WeekPage monday={monday} pivot={pivot} now={now} getPairs={getPairs} onPick={onPick}/>
            <WeekPage monday={addDays(monday, 7)} pivot={pivot} now={now} getPairs={getPairs} onPick={onPick}/>
        </div>
    )
}
