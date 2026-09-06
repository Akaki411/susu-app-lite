'use client'
// Выбор языка интерфейса

import {Sheet} from './sheet.tsx'
import {useI18n} from '@/i18n'
import {LANGUAGES, useSettings} from '@/lib/settings'

export const LanguageSheet = ({open, onClose}: { open: boolean; onClose: () => void }) => {
    const {t} = useI18n()
    const {settings, update} = useSettings()

    return (
        <Sheet open={open} onClose={onClose} title={t('settings.selectLanguage')}>
            {LANGUAGES.map((lang) => {
                const active = lang.code === settings.language
                return (
                    <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                            update({language: lang.code})
                            onClose()
                        }}
                        className="radio-row"
                    >
                        <span className={`radio-row__dot${active ? ' radio-row__dot--active' : ''}`}>
                            {active && <span className="radio-row__dot-fill"/>}
                        </span>
                        <span className="radio-row__flag" aria-hidden="true">{lang.flag}</span>
                        <span className={`radio-row__label${active ? ' radio-row__label--active' : ''}`}>
                            {lang.label}
                        </span>
                    </button>
                )
            })}
        </Sheet>
    )
}
