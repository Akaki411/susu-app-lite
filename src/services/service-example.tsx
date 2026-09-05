'use client'
// Образец сервиса

import {useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {ServiceTileBase} from './service-tile-base.tsx'

export default () => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <ServiceTileBase size={1} tone="c" icon="/icons/lock.webp" label="Пример" onClick={() => setOpen(true)}/>
            <Sheet open={open} onClose={() => setOpen(false)} title="Пример сервиса">
                <p className="service-example__text">Содержимое сервиса — модалка, iframe или что то ещё.</p>
            </Sheet>
        </>
    )
}
