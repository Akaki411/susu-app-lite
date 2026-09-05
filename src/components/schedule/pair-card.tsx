'use client'
// Одна пара в списке расписания

import {memo} from 'react'
import {Icon} from '@/components/common/icons'
import {LiveDot} from './live-dot.tsx'
import type {ScheduleEvent} from '@/shared/types'

function PairCardBase({event, live}: { event: ScheduleEvent; live: boolean }) {
    return (
        <div className="pair-card">
            <div className="pair-card__head">
                <span className="pair-card__type">
                    <span className="pair-card__type-text">{event.eventType}</span>
                    {live && <LiveDot/>}
                </span>
                <span className="pair-card__time">
                    {event.beginTime}–{event.endTime}
                </span>
            </div>
            <div className="pair-card__subject">{event.subject}</div>
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
                        {event.groups && event.groups.length > 0 ? ` · ${event.groups.join(', ')}` : ''}
                    </span>
                )}
            </div>
        </div>
    )
}

export const PairCard = memo(PairCardBase)
