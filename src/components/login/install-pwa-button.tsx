'use client'
// Кнопка установки PWA на экране входа

import {useState} from 'react'
import {Icon} from '@/components/common/icons'
import {useI18n} from '@/i18n'
import {usePwaInstall} from '@/lib/use-pwa-install'

export const InstallPwaButton = () => {
    const {t} = useI18n()
    const {canInstall, isIOS, promptInstall} = usePwaInstall()
    const [showIosHint, setShowIosHint] = useState(false)

    if (!canInstall) return null

    const onClick = async () => {
        if (isIOS) {
            setShowIosHint((v) => !v)
            return
        }
        await promptInstall()
    }

    return (
        <div className="install-pwa">
            <button type="button" onClick={onClick} className="install-pwa__button">
                <Icon name="download" className="install-pwa__icon"/>
                {t('login.installApp')}
            </button>
            {showIosHint && <p className="install-pwa__hint">{t('login.installHintIos')}</p>}
        </div>
    )
};
