// Настройки приложения

import {useState} from 'react'
import {LanguageSheet} from '@/components/common/language-sheet.tsx'
import {Sheet} from '@/components/common/sheet.tsx'
import {SwitchRow} from '@/components/common/switch-row.tsx'
import {Icon} from '@/components/common/icons'
import {useI18n} from '@/i18n'
import {LANGUAGES, useSettings, type PassButtonMode} from '@/lib/settings'
import {useTheme} from '@/lib/theme'
import {SERVICE_META} from '@/services/registry'

export const ServicesSettingsSheet = ({
    open,
    onClose,
    onOpenTiles
}: {
    open: boolean
    onClose: () => void
    onOpenTiles: () => void
}) => {
    const {t} = useI18n()
    const {dark, toggle} = useTheme()
    const {settings, update} = useSettings()
    const enabledTiles = SERVICE_META.filter((s) => (settings.tiles[s.id]?.enabled ?? true)).length
    const [langOpen, setLangOpen] = useState(false)
    const currentLanguage = LANGUAGES.find((l) => l.code === settings.language) ?? LANGUAGES[0]!

    return (
        <>
            <Sheet open={open} onClose={onClose} title={t('settings.title')}>
                <SwitchRow
                    icon={dark ? 'moon' : 'sun'}
                    label={t('settings.theme')}
                    hint={dark ? t('settings.themeOn') : t('settings.themeOff')}
                    on={dark}
                    onToggle={toggle}
                />
                <SwitchRow
                    icon="settings"
                    label={t('settings.notifications')}
                    hint={t('settings.notificationsHint')}
                    on={settings.notifications}
                    onToggle={() => update({notifications: !settings.notifications})}
                />
                <SwitchRow
                    icon="news"
                    label={t('settings.feedTab')}
                    hint={t('settings.feedTabHint')}
                    on={settings.feedEnabled}
                    onToggle={() => update({feedEnabled: !settings.feedEnabled})}
                />

                <div className="section-title section-title--spaced">{t('settings.passButton')}</div>
                <div className="segmented">
                    {(['fab', 'navbar'] as PassButtonMode[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => update({passButtonMode: m})}
                            className={`segmented__option${settings.passButtonMode === m ? ' segmented__option--active' : ''}`}
                        >
                            {m === 'fab' ? t('settings.passFab') : t('settings.passNav')}
                        </button>
                    ))}
                </div>

                <div className="section-title section-title--spaced">{t('settings.tiles')}</div>
                <button type="button" onClick={onOpenTiles} className="settings-nav-row">
                    <span className="settings-nav-row__label">{t('settings.tilesConfigure')}</span>
                    <span className="settings-nav-row__count">
                        {enabledTiles}/{SERVICE_META.length}
                    </span>
                    <Icon name="chevronRight" className="settings-nav-row__chevron"/>
                </button>

                <div className="section-title section-title--spaced">{t('settings.language')}</div>
                <button type="button" onClick={() => setLangOpen(true)} className="settings-nav-row">
                    <Icon name="world" className="settings-nav-row__icon"/>
                    <span className="settings-nav-row__label">
                        <span aria-hidden="true">{currentLanguage.flag}</span> {currentLanguage.label}
                    </span>
                    <Icon name="chevronRight" className="settings-nav-row__chevron"/>
                </button>
            </Sheet>
            <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)}/>
        </>
    )
}
