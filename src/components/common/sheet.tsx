'use client'
// Модальная шторка через портал в корень страницы

import {useEffect, useRef, useState, type ReactNode, type TouchEvent} from 'react'
import {createPortal} from 'react-dom'
import {Icon} from './icons'

const CLOSE_DURATION = 220
const SWIPE_UP_THRESHOLD = 60

export const Sheet = ({
    open,
    onClose,
    title,
    children,
    swipeUpToClose = false
}: {
    open: boolean
    onClose: () => void
    title: string
    children: ReactNode
    swipeUpToClose?: boolean
}) => {
    const [mounted, setMounted] = useState(open)
    const [closing, setClosing] = useState(false)
    const sheetRef = useRef<HTMLDivElement | null>(null)
    const touchStart = useRef<{ y: number; atTop: boolean } | null>(null)

    useEffect(() => {
        if (open) {
            setMounted(true)
            setClosing(false)
            return
        }
        if (!mounted) return
        setClosing(true)
        const id = setTimeout(() => {
            setMounted(false)
            setClosing(false)
        }, CLOSE_DURATION)
        return () => clearTimeout(id)
    }, [open])

    useEffect(() => {
        if (!mounted) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [mounted])

    if (!mounted || typeof document === 'undefined') return null

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (!swipeUpToClose) return
        const t = e.touches[0]
        const el = sheetRef.current
        if (!t || !el) return
        touchStart.current = {y: t.clientY, atTop: el.scrollTop <= 0}
    }

    const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        if (!swipeUpToClose) return
        const s = touchStart.current
        touchStart.current = null
        const t = e.changedTouches[0]
        if (!s || !t || !s.atTop) return
        if (s.y - t.clientY > SWIPE_UP_THRESHOLD) onClose()
    }

    return createPortal(
        <div
            className={`sheet-overlay${closing ? ' sheet-overlay--closing' : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                ref={sheetRef}
                className={`sheet${closing ? ' sheet--closing' : ''}`}
                role="dialog"
                aria-modal="true"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                <div className="sheet__head">
                    <h3 className="sheet__title">{title}</h3>
                    <button type="button" onClick={onClose} aria-label="Закрыть" className="sheet__close">
                        <Icon name="x" className="sheet__close-icon"/>
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    )
};
