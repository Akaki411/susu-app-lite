'use client'
// Карусель недель

import {useEffect, useState, type ReactNode} from 'react'

type Dir = 'left' | 'right' | null

export const WeekCarousel = ({
    weeks,
    index,
    renderWeek,
    dir,
    onSettled,
}: {
    weeks: Date[]
    index: number
    renderWeek: (monday: Date) => ReactNode
    dir: Dir
    onSettled: () => void
}) => {
    const [suppress, setSuppress] = useState(false)
    const prev = weeks[index - 1] ?? null
    const curr = weeks[index] ?? null
    const next = weeks[index + 1] ?? null

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

    const pane = (monday: Date | null) => (
        <div className="week-carousel__pane">{monday ? renderWeek(monday) : null}</div>
    )

    return (
        <div className="week-carousel">
            <div
                className={`week-carousel__track${suppress ? ' week-carousel__track--suppressed' : ''}`}
                style={{transform: `translateX(${translate})`}}
                onTransitionEnd={onTransitionEnd}
            >
                {pane(prev)}
                {pane(curr)}
                {pane(next)}
            </div>
        </div>
    )
}
