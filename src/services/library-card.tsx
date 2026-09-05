'use client'
// Читательский билет

import {useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'
import {qrUrlFor} from '@/lib/api-client'
import {tileConfig, useSettings} from '@/lib/settings'
import {getProfile} from '@/lib/token-store'
import {ServiceTileBase} from './service-tile-base.tsx'

export default () => {
    const {t} = useI18n()
    const {settings} = useSettings()
    const [open, setOpen] = useState(false)
    const cfg = tileConfig(settings, 'library', 2)
    if (!cfg.enabled) return null

    const profile = getProfile()
    const card = profile?.libraryCardNumber
    const photo = profile?.photo
    const photoSrc = photo ? (photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`) : null

    return (
        <>
            <ServiceTileBase
                size={cfg.size}
                tone="a"
                icon="/icons/book.webp"
                label={t('services.libraryCard')}
                onClick={() => setOpen(true)}
            />
            <Sheet open={open} onClose={() => setOpen(false)} title={t('library.title')}>
                {card ? (
                    <div className="library-card">
                        {photoSrc && <img src={photoSrc} alt="" className="library-card__photo"/>}
                        <div className="library-card__qr-wrap">
                            <img src={qrUrlFor(card)} alt={t('library.title')} className="library-card__qr"/>
                        </div>
                        <div className="library-card__label">{t('library.number')}</div>
                        <div className="library-card__number">{card}</div>
                        <div className="library-card__hint">{t('library.hint')}</div>
                    </div>
                ) : (
                    <div className="empty-state empty-state--compact">{t('library.unavailable')}</div>
                )}
            </Sheet>
        </>
    )
}
