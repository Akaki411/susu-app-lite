'use client'
// Полноэкранный просмотр картинки с приближением

import {useRef, useState, type MouseEvent, type TouchEvent} from 'react'
import {createPortal} from 'react-dom'
import {Icon} from './icons'

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_ZOOM = 2.5
const DOUBLE_TAP_MS = 300

type Point = { x: number; y: number }

type Gesture =
    | { mode: 'pinch'; startDist: number; startScale: number; startTranslate: Point; startCenter: Point }
    | { mode: 'pan'; startPoint: Point; startTranslate: Point }

const distanceOf = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
const midOf = (a: Point, b: Point): Point => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2});
const clampScale = (s: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

export const ImageViewer = ({src, alt, onClose}: { src: string | null; alt: string; onClose: () => void }) => {
    const [scale, setScale] = useState(1)
    const [translate, setTranslate] = useState<Point>({x: 0, y: 0})
    const [live, setLive] = useState(false)
    const gesture = useRef<Gesture | null>(null)
    const lastTap = useRef(0)

    if (!src) return null

    const reset = () => {
        setScale(1)
        setTranslate({x: 0, y: 0})
    };

    const close = () => {
        reset()
        onClose()
    };

    const settle = () => {
        if (scale < MIN_SCALE + 0.02) reset()
    };

    const toggleZoom = (point: Point, containerRect: DOMRect) => {
        setLive(false)
        if (scale > 1) {
            reset()
            return
        }
        const originX = point.x - containerRect.left - containerRect.width / 2
        const originY = point.y - containerRect.top - containerRect.height / 2
        setScale(DOUBLE_TAP_ZOOM)
        setTranslate({x: -originX * (DOUBLE_TAP_ZOOM - 1), y: -originY * (DOUBLE_TAP_ZOOM - 1)})
    };

    const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            const a = {x: e.touches[0]!.clientX, y: e.touches[0]!.clientY}
            const b = {x: e.touches[1]!.clientX, y: e.touches[1]!.clientY}
            gesture.current = {
                mode: 'pinch',
                startDist: distanceOf(a, b),
                startScale: scale,
                startTranslate: translate,
                startCenter: midOf(a, b),
            }
            setLive(true)
            return
        }
        if (e.touches.length === 1) {
            const now = Date.now()
            const point = {x: e.touches[0]!.clientX, y: e.touches[0]!.clientY}
            if (now - lastTap.current < DOUBLE_TAP_MS) {
                lastTap.current = 0
                gesture.current = null
                toggleZoom(point, e.currentTarget.getBoundingClientRect())
                return
            }
            lastTap.current = now
            if (scale > 1) {
                gesture.current = {mode: 'pan', startPoint: point, startTranslate: translate}
                setLive(true)
            }
        }
    };

    const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
        const g = gesture.current
        if (!g) return
        if (g.mode === 'pinch' && e.touches.length === 2) {
            const a = {x: e.touches[0]!.clientX, y: e.touches[0]!.clientY}
            const b = {x: e.touches[1]!.clientX, y: e.touches[1]!.clientY}
            const next = clampScale(g.startScale * (distanceOf(a, b) / g.startDist))
            setScale(next)
        } else if (g.mode === 'pan' && e.touches.length === 1) {
            const point = {x: e.touches[0]!.clientX, y: e.touches[0]!.clientY}
            setTranslate({
                x: g.startTranslate.x + (point.x - g.startPoint.x),
                y: g.startTranslate.y + (point.y - g.startPoint.y),
            })
        }
    };

    const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 0) {
            gesture.current = null
            setLive(false)
            settle()
        }
    };

    const onDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
        toggleZoom({x: e.clientX, y: e.clientY}, e.currentTarget.getBoundingClientRect())
    };

    return createPortal(
        <div className="image-viewer">
            <button type="button" onClick={close} aria-label="Закрыть" className="image-viewer__close">
                <Icon name="x" className="image-viewer__close-icon"/>
            </button>
            <div
                className="image-viewer__stage"
                onClick={(e) => {
                    if (e.target === e.currentTarget) close()
                }}
                onDoubleClick={onDoubleClick}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable={false}
                    className={`image-viewer__img${live ? ' image-viewer__img--live' : ''}`}
                    style={{transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`}}
                />
            </div>
        </div>,
        document.body,
    )
};
