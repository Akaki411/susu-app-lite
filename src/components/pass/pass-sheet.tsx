'use client'
// Шторка электронного пропуска c QR

import {useEffect, useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {OPEN_PASS_EVENT} from '@/components/nav/nav-items'
import {useI18n} from '@/i18n'
import {qrUrl} from '@/lib/api-client'
import {getProfile} from '@/lib/token-store'

export const PassSheet = () => {
    const {t} = useI18n()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handler = () => setOpen(true)
        window.addEventListener(OPEN_PASS_EVENT, handler)
        return () => window.removeEventListener(OPEN_PASS_EVENT, handler)
    }, [])

    const profile = getProfile()
    const src = qrUrl()

    return (
        <Sheet open={open} onClose={() => setOpen(false)} title={t('pass.title')} draggable={false}>
            {src && profile ? (
                <div className="pass-card">
                    <div className="pass-card__qr-wrap">
                        <img src={src} alt={t('pass.title')} className="pass-card__qr"/>
                    </div>
                    <div className="pass-card__name">
                        {profile.lastName} {profile.firstName} · {profile.groupName}
                    </div>
                    <div className="pass-card__hint">{t('pass.hint')}</div>
                </div>
            ) : (
                <div className="empty-state empty-state--compact">{t('pass.unavailable')}</div>
            )}
        </Sheet>
    )
}
