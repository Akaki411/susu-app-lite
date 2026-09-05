'use client'
// Точки по количеству пар в дне. Точка текущей пары увеличивается во время её проведения

import {isPairNow} from '@/lib/schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

export function DayDots({pairs, dateKey, now}: { pairs: ScheduleEvent[]; dateKey: string; now: Date }) {

    if (pairs.length === 0) return null

    return (
        <span className="day-dots" aria-hidden="true">
            {pairs.map((p, i) => {
                const live = isPairNow(p, dateKey, now)
                return <i key={i} className={`day-dots__dot${live ? ' day-dots__dot--live' : ''}`}/>
            })}
        </span>
    )
}
