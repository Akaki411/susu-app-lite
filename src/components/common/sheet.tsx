'use client'
// Модальная шторка через портал в корень страницы

import {useEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent} from 'react'
import {createPortal} from 'react-dom'
import {Icon} from './icons'

const CLOSE_DURATION = 220
const DRAG_CLOSE_PX = 100
const DRAG_EXPAND_PX = 60
const EXPAND_LIFT_MAX = 90

export const Sheet = ({
    open,
    onClose,
    title,
    children,
    draggable = true
}: {
    open: boolean
    onClose: () => void
    title: string
    children: ReactNode
    draggable?: boolean
}) => {
    const [mounted, setMounted] = useState(open)
    const [closing, setClosing] = useState(false)
    const [expanded, setExpanded] = useState(false)
    const [dragY, setDragY] = useState(0)
    const [settling, setSettling] = useState(false)
    const sheetRef = useRef<HTMLDivElement | null>(null)
    const dragZoneRef = useRef<HTMLDivElement | null>(null)
    const touchState = useRef<{ y: number; atTop: boolean; fromHandle: boolean } | null>(null)
    const dismissing = useRef(false)

    useEffect(() => {
        if (open) {
            setMounted(true)
            setClosing(false)
            setExpanded(false)
            setDragY(0)
            dismissing.current = false
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
        if (!draggable || dismissing.current) return
        const t = e.touches[0]
        const el = sheetRef.current
        const handle = dragZoneRef.current
        if (!t || !el) return
        const fromHandle = !!(handle && e.target instanceof Node && handle.contains(e.target))
        touchState.current = {y: t.clientY, atTop: fromHandle || el.scrollTop <= 0, fromHandle}
        setSettling(false)
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        const s = touchState.current
        const t = e.touches[0]
        if (!draggable || !s || !t) return
        const dy = t.clientY - s.y
        if (dy > 0) {
            if (!s.atTop) return
            setDragY(dy)
        } else if (s.fromHandle && !expanded) {
            setDragY(Math.max(dy, -EXPAND_LIFT_MAX))
        }
    };

    const onTouchEnd = () => {
        const s = touchState.current
        touchState.current = null
        if (!draggable || !s) return

        if (dragY > DRAG_CLOSE_PX) {
            dismissing.current = true
            setSettling(true)
            const flee = (sheetRef.current?.getBoundingClientRect().height ?? 800) + 120
            setDragY(flee)
            return
        }

        setSettling(true)
        if (dragY < -DRAG_EXPAND_PX) setExpanded(true)
        setDragY(0)
    };

    const onSheetTransitionEnd = () => {
        setSettling(false)
        if (dismissing.current) {
            dismissing.current = false
            setMounted(false)
            setDragY(0)
            setExpanded(false)
            onClose()
        }
    };

    const style: CSSProperties | undefined =
        dragY !== 0 ? {transform: `translateY(${Math.max(dragY, 0)}px)`} : undefined;

    return createPortal(
        <div
            className={`sheet-overlay${closing ? ' sheet-overlay--closing' : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                ref={sheetRef}
                className={`sheet${closing ? ' sheet--closing' : ''}${expanded ? ' sheet--expanded' : ''}${settling ? ' sheet--settling' : ''}`}
                role="dialog"
                aria-modal="true"
                style={style}
                onTransitionEnd={onSheetTransitionEnd}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div ref={dragZoneRef} className="sheet__drag-zone">
                    {draggable && <span className="sheet__handle" aria-hidden="true"/>}
                    <div className="sheet__head">
                        <h3 className="sheet__title">{title}</h3>
                        <button type="button" onClick={onClose} aria-label="Закрыть" className="sheet__close">
                            <Icon name="x" className="sheet__close-icon"/>
                        </button>
                    </div>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    )
};
