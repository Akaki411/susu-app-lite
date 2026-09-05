'use client'
// Плавающая кнопка вызова QR-пропуска

import {Icon} from '@/components/common/icons'
import {openPass} from '@/components/nav/nav-items'
import {useI18n} from '@/i18n'
import {useSettings} from '@/lib/settings'

export const PassFab = () => {
    const {t} = useI18n()
    const {settings} = useSettings()
    if (settings.passButtonMode !== 'fab') return null

    return (
        <button type="button" onClick={openPass} aria-label={t('pass.title')} className="pass-fab">
            <Icon name="qrcode" className="pass-fab__icon"/>
        </button>
    )
}
