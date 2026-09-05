'use client'
// Карусель дня в расписании

import {useEffect, useState} from 'react'
import {PairCard} from './pair-card.tsx'
import {addDays, isPairNow, toKey} from '@/lib/schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

type Dir = 'left' | 'right' | null

const Pane = ({
    pairs,
    dateKey,
    now,
    emptyText
}: {
    pairs: ScheduleEvent[]
    dateKey: string
    now: Date
    emptyText: string
}) => (
    <div className="day-carousel__pane">
        {pairs.length > 0 ? (
            <div className="pair-list">
                {pairs.map((p, i) => (
                    <PairCard key={i} event={p} live={isPairNow(p, dateKey, now)}/>
                ))}
            </div>
        ) : (
            <div className="empty-state">{emptyText}</div>
        )}
    </div>
)

export const DayCarousel = ({
    pivot,
    getPairs,
    now,
    emptyText,
    dir,
    step = 1,
    onSettled
}: {
    pivot: Date
    getPairs: (day: Date) => ScheduleEvent[]
    now: Date
    emptyText: string
    dir: Dir
    step?: number
    onSettled: () => void
}) => {
    const [suppress, setSuppress] = useState(false)
    const prevDay = addDays(pivot, -step)
    const nextDay = addDays(pivot, step)

    useEffect(() => {
        if (!suppress) return
        const id = requestAnimationFrame(() => setSuppress(false))
        return () => cancelAnimationFrame(id)
    }, [suppress])

    const translate = dir === 'left' ? '-66.6667%' : dir === 'right' ? '0%' : '-33.3333%'

    const onTransitionEnd = () => {
        if (!dir) return
        setSuppress(true)
        onSettled()
    }

    return (
        <div className="day-carousel">
            <div
                className={`day-carousel__track${suppress ? ' day-carousel__track--suppressed' : ''}`}
                style={{transform: `translateX(${translate})`}}
                onTransitionEnd={onTransitionEnd}
            >
                <Pane pairs={getPairs(prevDay)} dateKey={toKey(prevDay)} now={now} emptyText={emptyText}/>
                <Pane pairs={getPairs(pivot)} dateKey={toKey(pivot)} now={now} emptyText={emptyText}/>
                <Pane pairs={getPairs(nextDay)} dateKey={toKey(nextDay)} now={now} emptyText={emptyText}/>
            </div>
        </div>
    )
}
