'use client'
// Одна пара в списке расписания

import {memo} from 'react'
import {Icon} from '@/components/common/icons'
import {LiveDot} from './live-dot.tsx'
import {pairCategoryOf} from '@/lib/schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

function PairCardBase({event, live}: { event: ScheduleEvent; live: boolean }) {
    if (!event) return null
    const category = pairCategoryOf(event.eventType)
    const groups = Array.isArray(event.groups) && event.groups.length > 0 ? event.groups.join(', ') : ''
    const beginTime = event.beginTime || ''
    const endTime = event.endTime || ''
    const timeStr = beginTime && endTime ? `${beginTime}–${endTime}` : beginTime || endTime

    return (
        <div className={`pair-card pair-card--${category}`}>
            <div className="pair-card__head">
                <span className="pair-card__type">
                    <span className="pair-card__type-text">{event.eventType || ''}</span>
                    {live && <LiveDot/>}
                </span>
                {timeStr && (
                    <span className="pair-card__time">
                        {timeStr}
                    </span>
                )}
            </div>
            <div className="pair-card__subject">{event.subject || ''}</div>
            <div className="pair-card__meta">
                {event.teacher && (
                    <span className="pair-card__meta-row">
                        <Icon name="user" className="pair-card__meta-icon"/>
                        {event.teacher}
                    </span>
                )}
                {event.room && (
                    <span className="pair-card__meta-row">
                        <Icon name="mapPin" className="pair-card__meta-icon"/>
                        {event.room}
                        {groups ? ` · ${groups}` : ''}
                    </span>
                )}
            </div>
        </div>
    )
}

export const PairCard = memo(PairCardBase)
