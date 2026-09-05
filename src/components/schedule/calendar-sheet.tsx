'use client'
// Пикер даты для расписания. Сетка месяца с переключением месяцев

import {useRef, useState, type TouchEvent} from 'react'
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

const DRAG_MOVE_THRESHOLD = 8
const DRAG_COMMIT_PX = 60
const DRAG_COMMIT_RATIO = 0.2

const addMonths = (d: Date, n: number): Date => new Date(d.getFullYear(), d.getMonth() + n, 1);

const monthCells = (month: Date): (Date | null)[] => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const startOffset = (first.getDay() + 6) % 7 // Пн=0
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d))
    return cells
};

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

    const trackRef = useRef<HTMLDivElement | null>(null)
    const dragStartX = useRef<number | null>(null)
    const moved = useRef(false)
    const [dragX, setDragX] = useState(0)
    const [settleDir, setSettleDir] = useState<'left' | 'right' | null>(null)
    const [animating, setAnimating] = useState(false)

    const shiftMonth = (delta: 1 | -1) => {
        setAnimating(true)
        setSettleDir(delta > 0 ? 'left' : 'right')
    };

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (settleDir) return
        const t0 = e.touches[0]
        if (!t0) return
        dragStartX.current = t0.clientX
        moved.current = false
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        const startX = dragStartX.current
        const t0 = e.touches[0]
        if (startX == null || !t0) return
        const dx = t0.clientX - startX
        if (Math.abs(dx) > DRAG_MOVE_THRESHOLD) moved.current = true
        setDragX(dx)
    };

    const onTouchEnd = () => {
        if (dragStartX.current == null) return
        dragStartX.current = null
        const width = trackRef.current?.clientWidth ?? 0
        const threshold = Math.max(DRAG_COMMIT_PX, width * DRAG_COMMIT_RATIO)
        setAnimating(true)
        if (Math.abs(dragX) > threshold) {
            setSettleDir(dragX < 0 ? 'left' : 'right')
        } else {
            setDragX(0)
        }
    };

    const onTrackTransitionEnd = () => {
        setSettleDir((dir) => {
            if (dir) setMonth((m) => addMonths(m, dir === 'left' ? 1 : -1))
            return null
        })
        setAnimating(false)
        setDragX(0)
    };

    const prevMonth = addMonths(month, -1)
    const nextMonth = addMonths(month, 1)

    const translate = settleDir
        ? settleDir === 'left' ? '-66.6667%' : '0%'
        : `calc(-33.3333% + ${dragX}px)`

    const renderGrid = (m: Date) => (
        <div className="calendar__grid">
            {DOW_SHORT.map((d, i) => (
                <div key={d} className={`calendar__dow${i === 5 || i === 6 ? ' calendar__dow--weekend' : ''}`}>
                    {d}
                </div>
            ))}
            {monthCells(m).map((d, i) => {
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
                            if (moved.current) return
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
    );

    return (
        <Sheet open={open} onClose={onClose} title={t('schedule.calendar')}>
            <div className="calendar__nav">
                <button
                    type="button"
                    aria-label="Предыдущий месяц"
                    onClick={() => shiftMonth(-1)}
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
                    onClick={() => shiftMonth(1)}
                    className="calendar__nav-btn"
                >
                    <Icon name="chevronRight" className="calendar__nav-icon"/>
                </button>
            </div>

            <div
                className="calendar__grid-swipe"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div
                    ref={trackRef}
                    className={`calendar__track${animating ? ' calendar__track--animating' : ''}`}
                    style={{transform: `translateX(${translate})`}}
                    onTransitionEnd={onTrackTransitionEnd}
                >
                    <div className="calendar__pane">{renderGrid(prevMonth)}</div>
                    <div className="calendar__pane">{renderGrid(month)}</div>
                    <div className="calendar__pane">{renderGrid(nextMonth)}</div>
                </div>
            </div>
        </Sheet>
    )
};
