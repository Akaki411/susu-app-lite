'use client'
// Модальная шторка через портал в корень страницы

import {useEffect, useRef, useState, type CSSProperties, type ReactNode} from 'react'
import {createPortal} from 'react-dom'
import {Icon} from './icons'

const CLOSE_DURATION = 200
const DRAG_CLOSE_PX = 90
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
    const dismissing = useRef(false)
    const dragRef = useRef(0)

    useEffect(() => {
        if (open) {
            setMounted(true)
            setClosing(false)
            setExpanded(false)
            setDragY(0)
            dragRef.current = 0
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

    useEffect(() => {
        if (!mounted || !draggable) return
        const zone = dragZoneRef.current
        const sheet = sheetRef.current
        if (!zone || !sheet) return

        let startY: number | null = null

        const onMove = (e: PointerEvent) => {
            if (startY == null) return
            const dy = e.clientY - startY
            if (dy > 0) {
                dragRef.current = dy
                setDragY(dy)
            } else if (!expanded) {
                dragRef.current = Math.max(dy, -EXPAND_LIFT_MAX)
                setDragY(dragRef.current)
            } else {
                dragRef.current = 0
                setDragY(0)
            }
        }

        const onUp = () => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
            if (startY == null) return
            startY = null
            const drag = dragRef.current

            if (drag > DRAG_CLOSE_PX) {
                dismissing.current = true
                setSettling(true)
                const flee = (sheet.getBoundingClientRect().height || 800) + 120
                dragRef.current = flee
                setDragY(flee)
                return
            }

            setSettling(true)
            if (drag < -DRAG_EXPAND_PX) setExpanded(true)
            dragRef.current = 0
            setDragY(0)
        }

        const onDown = (e: PointerEvent) => {
            if (dismissing.current) return
            const target = e.target as Element | null
            if (target?.closest?.('.sheet__close')) return // не мешаем кнопке закрытия
            startY = e.clientY
            dragRef.current = 0
            setSettling(false)
            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp)
            window.addEventListener('pointercancel', onUp)
        }

        zone.addEventListener('pointerdown', onDown)
        return () => {
            zone.removeEventListener('pointerdown', onDown)
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            window.removeEventListener('pointercancel', onUp)
        }
    }, [mounted, draggable, expanded])

    if (!mounted || typeof document === 'undefined') return null

    const onSheetTransitionEnd = () => {
        setSettling(false)
        if (dismissing.current) {
            dismissing.current = false
            setMounted(false)
            dragRef.current = 0
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
