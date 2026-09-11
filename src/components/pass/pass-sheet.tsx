'use client'
// Шторка электронного пропуска c QR

import {useEffect, useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {QrImage} from '@/components/common/qr-image.tsx'
import {OPEN_PASS_EVENT} from '@/components/nav/nav-items'
import {useI18n} from '@/i18n'
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
    const ticket = profile?.passTicket

    return (
        <Sheet open={open} onClose={() => setOpen(false)} title={t('pass.title')}>
            {ticket && profile ? (
                <div className="pass-card">
                    <div className="pass-card__qr-wrap">
                        <QrImage data={ticket} className="pass-card__qr" label={t('pass.title')}/>
                    </div>
                    <div className="pass-card__name">
                        {profile.lastName} {profile.firstName} · {profile.groupName}
                    </div>
                    <div className="pass-card__hint">{t('pass.hint')}</div>
                    <div style={{width: '1px', height: "5rem"}}/>
                </div>
            ) : (
                <div className="empty-state empty-state--compact">{t('pass.unavailable')}</div>
            )}
        </Sheet>
    )
}
