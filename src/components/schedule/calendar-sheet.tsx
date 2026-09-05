'use client'
// Пикер даты для расписания. Сетка месяца с переключением месяцев

import {useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {Icon} from '@/components/common/icons'
import {DayDots} from '@/components/schedule/day-dots.tsx'
import {useI18n} from '@/i18n'
import {DOW_SHORT, sameDay, toKey} from '@/lib/schedule-utils'
import type {ScheduleEvent} from '@/shared/types'

const MONTHS_FULL = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export const CalendarSheet = ({
    open,
    onClose,
    selected,
    getPairs,
    now,
    onPick
}: {
    open: boolean
    onClose: () => void
    selected: Date
    getPairs: (d: Date) => ScheduleEvent[]
    now: Date
    onPick: (d: Date) => void
}) => {
    const {t} = useI18n()
    const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))
    const today = new Date()

    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7 // Пн=0
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()

    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d))

    return (
        <Sheet open={open} onClose={onClose} title={t('schedule.calendar')}>
            <div className="calendar__nav">
                <button
                    type="button"
                    aria-label="Предыдущий месяц"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    className="calendar__nav-btn"
                >
                    <Icon name="chevronLeft" className="calendar__nav-icon"/>
                </button>
                <span className="calendar__title">
                    {MONTHS_FULL[month.getMonth()]} {month.getFullYear()}
                </span>
                <button
                    type="button"
                    aria-label="Следующий месяц"
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="calendar__nav-btn"
                >
                    <Icon name="chevronRight" className="calendar__nav-icon"/>
                </button>
            </div>

            <div className="calendar__grid">
                {DOW_SHORT.map((d, i) => (
                    <div key={d} className={`calendar__dow${i === 5 || i === 6 ? ' calendar__dow--weekend' : ''}`}>
                        {d}
                    </div>
                ))}
                {cells.map((d, i) => {
                    if (d == null) return <div key={`e${i}`}/>
                    const weekend = i % 7 === 5 || i % 7 === 6
                    const isSelected = sameDay(d, selected)
                    const isToday = sameDay(d, today)
                    const dayPairs = getPairs(d)
                    const modifiers = [
                        weekend && 'calendar__cell--weekend',
                        isToday && 'calendar__cell--today',
                        isSelected && 'calendar__cell--selected',
                    ]
                        .filter(Boolean)
                        .join(' ')
                    return (
                        <button
                            key={toKey(d)}
                            type="button"
                            onClick={() => {
                                onPick(d)
                                onClose()
                            }}
                            className={`calendar__cell${modifiers ? ` ${modifiers}` : ''}`}
                        >
                            <span>{d.getDate()}</span>
                            <DayDots pairs={dayPairs} dateKey={toKey(d)} now={now}/>
                        </button>
                    )
                })}
            </div>
        </Sheet>
    )
};
