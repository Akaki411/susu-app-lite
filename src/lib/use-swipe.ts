'use client'

import {useRef, useState, type TouchEvent} from 'react'

export type PullType = 'content' | 'page' | null

interface SwipeCallbacks {
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    onPullRefresh?: () => void
    onPullRefreshPage?: () => void
}

const H_THRESHOLD = 60
const V_THRESHOLD = 70
const MAX_PULL = 90

export const useSwipe = ({
    onSwipeLeft,
    onSwipeRight,
    onPullRefresh,
    onPullRefreshPage,
}: SwipeCallbacks) => {
    const start = useRef<{ x: number; y: number; atTop: boolean; fromHeader: boolean } | null>(null)
    const [pullDistance, setPullDistance] = useState(0)
    const [pullType, setPullType] = useState<PullType>(null)

    const onTouchStart = (e: TouchEvent<HTMLElement>) => {
        const t = e.touches[0]
        if (!t) return
        const el = e.currentTarget
        const atTop = el.scrollTop <= 0 && (typeof window === 'undefined' || window.scrollY <= 0)
        const target = e.target as Element | null
        const fromHeader = Boolean(target?.closest?.('.screen__header, .page-header'))
        start.current = {x: t.clientX, y: t.clientY, atTop, fromHeader}
    };

    const onTouchMove = (e: TouchEvent<HTMLElement>) => {
        const s = start.current
        const t = e.touches[0]
        if (!s || !t) return
        const dy = t.clientY - s.y
        const dx = t.clientX - s.x

        if (s.atTop && dy > 0 && Math.abs(dy) > Math.abs(dx)) {
            if (s.fromHeader) {
                setPullType('page')
                setPullDistance(Math.min(dy * 0.5, MAX_PULL))
            } else if (onPullRefresh) {
                setPullType('content')
                setPullDistance(Math.min(dy * 0.5, MAX_PULL))
            }
        }
    };

    const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
        const s = start.current
        start.current = null
        const t = e.changedTouches[0]
        if (!s || !t) {
            setPullDistance(0)
            setPullType(null)
            return
        }
        const dx = t.clientX - s.x
        const dy = t.clientY - s.y

        if (s.atTop && dy > V_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
            if (s.fromHeader) {
                setPullDistance(0)
                setPullType(null)
                if (onPullRefreshPage) {
                    onPullRefreshPage()
                } else if (typeof window !== 'undefined') {
                    window.location.reload()
                }
                return
            } else if (onPullRefresh) {
                onPullRefresh()
                setPullDistance(0)
                setPullType(null)
                return
            }
        }

        setPullDistance(0)
        setPullType(null)

        if (Math.abs(dx) > H_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) onSwipeLeft?.()
            else onSwipeRight?.()
        }
    };

    return {handlers: {onTouchStart, onTouchMove, onTouchEnd}, pullDistance, pullType}
};
