'use client'
// QR-код пропуска / читательского билета

import {useEffect, useRef, useState, type CSSProperties} from 'react'
import {qrUrlFor} from '@/lib/api-client'
import {useSettings} from '@/lib/settings'

const DOUBLE_TAP_MS = 320

export const QrImage = ({data, className, label}: { data: string; className?: string; label?: string }) => {
    const [svg, setSvg] = useState<string | null>(null)
    const {settings, update} = useSettings()
    const hc = settings.highContrastQr
    const lastTap = useRef(0)

    useEffect(() => {
        let cancelled = false
        setSvg(null)
        fetch(qrUrlFor(data))
            .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
            .then((text) => {
                if (!cancelled) setSvg(text)
            })
            .catch(() => {
                if (!cancelled) setSvg(null)
            })
        return () => {
            cancelled = true
        }
    }, [data])

    const onTap = () => {
        const now = Date.now()
        if (now - lastTap.current < DOUBLE_TAP_MS) {
            lastTap.current = 0
            update({highContrastQr: !hc})
        } else {
            lastTap.current = now
        }
    }

    const style: CSSProperties = {touchAction: 'manipulation'}
    if (hc) {
        style.color = '#000'
        style.background = '#fff'
        style.borderRadius = '0.875rem'
        style.padding = '0.5rem'
    }

    return (
        <div
            className={className}
            role="img"
            aria-label={label}
            style={style}
            onClick={onTap}
            {...(svg ? {dangerouslySetInnerHTML: {__html: svg}} : {})}
        />
    )
}
