'use client'
// Сворачиваемый блок дня, режим «по неделям»

import {Icon} from '@/components/common/icons'
import {PairCard} from './pair-card.tsx'
import {DayDots} from './day-dots.tsx'
import {DOW_SHORT, fmtLong, isPairNow, sameDay, toKey} from '@/lib/schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

export const DayBlock = ({
    date,
    pairs,
    expanded,
    onToggle,
    now
}: {
    date: Date
    pairs: ScheduleEvent[]
    expanded: boolean
    onToggle: () => void
    now: Date
}) => {
    const dowIdx = (date.getDay() + 6) % 7
    const isToday = sameDay(date, now)
    const key = toKey(date)

    return (
        <div className="day-block">
            <button type="button" onClick={onToggle} className="day-block__head">
                <span className="day-block__title-group">
                    <span className="day-block__title">
                        {DOW_SHORT[dowIdx]}, {fmtLong(date)}
                    </span>
                    {isToday && <span className="day-block__badge">Сегодня</span>}
                    <DayDots pairs={pairs} dateKey={key} now={now}/>
                </span>
                <Icon name="chevronDown" className={`day-block__chevron${expanded ? ' day-block__chevron--expanded' : ''}`}/>
            </button>
            {expanded && (
                <div className="pair-list">
                    {pairs.map((p, i) => (
                        <PairCard key={i} event={p} live={isPairNow(p, key, now)}/>
                    ))}
                </div>
            )}
        </div>
    )
};
