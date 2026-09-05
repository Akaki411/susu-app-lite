'use client'

import {useRef, useState, type TouchEvent} from 'react'

interface SwipeCallbacks {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onPullRefresh?: () => void
}

const H_THRESHOLD = 60
const V_THRESHOLD = 70
const MAX_PULL = 90

export const useSwipe = ({onSwipeLeft, onSwipeRight, onPullRefresh}: SwipeCallbacks) => {
    const start = useRef<{ x: number; y: number; atTop: boolean } | null>(null)
    const [pullDistance, setPullDistance] = useState(0)

    const onTouchStart = (e: TouchEvent<HTMLElement>) => {
        const t = e.touches[0]
        if (!t) return
        const el = e.currentTarget
        const atTop = el.scrollTop <= 0 && (typeof window === 'undefined' || window.scrollY <= 0)
        start.current = {x: t.clientX, y: t.clientY, atTop}
    };

    const onTouchMove = (e: TouchEvent<HTMLElement>) => {
        const s = start.current
        const t = e.touches[0]
        if (!s || !t) return
        const dy = t.clientY - s.y
        const dx = t.clientX - s.x
        if (onPullRefresh && s.atTop && dy > 0 && Math.abs(dy) > Math.abs(dx)) {
            setPullDistance(Math.min(dy * 0.5, MAX_PULL))
        }
    };

    const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
        const s = start.current
        start.current = null
        const t = e.changedTouches[0]
        if (!s || !t) {
            setPullDistance(0)
            return
        }
        const dx = t.clientX - s.x
        const dy = t.clientY - s.y

        if (onPullRefresh && s.atTop && dy > V_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
            onPullRefresh()
            setPullDistance(0)
            return
        }
        setPullDistance(0)

        if (Math.abs(dx) > H_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) onSwipeLeft?.()
            else onSwipeRight?.()
        }
    };

    return {handlers: {onTouchStart, onTouchMove, onTouchEnd}, pullDistance}
};
