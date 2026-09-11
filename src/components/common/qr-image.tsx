'use client'
// QR-код пропуска

import {useEffect, useState} from 'react'
import {qrUrlFor} from '@/lib/api-client'

export const QrImage = ({data, className, label}: { data: string; className?: string; label?: string }) => {
    const [svg, setSvg] = useState<string | null>(null)

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

    return (
        <div
            className={className}
            role="img"
            aria-label={label}
            {...(svg ? {dangerouslySetInnerHTML: {__html: svg}} : {})}
        />
    )
}
