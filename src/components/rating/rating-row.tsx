'use client'
// Одна строка рейтинга. Тап открывает панель детализации по дисциплине

import {memo} from 'react'
import {Icon} from '@/components/common/icons'
import {useI18n} from '@/i18n'
import {statusFor} from '@/lib/rating-utils'
import type {RatingSubject} from '@/shared/types'

const RatingRowBase = ({subject, onOpen}: { subject: RatingSubject; onOpen: (subject: RatingSubject) => void }) => {
    const {t} = useI18n()
    const {color, statusKey} = statusFor(subject)

    return (
        <button type="button" onClick={() => onOpen(subject)} className="rating-row">
            <div className="rating-row__type">{subject.controlType}</div>
            <div className="rating-row__name">{subject.name}</div>
            {subject.teacher && (
                <div className="rating-row__teacher">
                    <Icon name="user" className="rating-row__teacher-icon"/>
                    {subject.teacher}
                </div>
            )}
            <div className="rating-row__stats">
                <span className="rating-row__score" style={{color}}>
                    {subject.rating > 0 ? `${subject.rating}%` : '—'}
                </span>
                {statusKey && (
                    <span className="rating-row__status" style={{color}}>
                        {t(`rating.status.${statusKey}`)}
                    </span>
                )}
            </div>
        </button>
    )
}

export const RatingRow = memo(RatingRowBase)
