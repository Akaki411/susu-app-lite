'use client'

import {useEffect, useState} from 'react'
import ru, {type I18nKey} from './ru'
import en from './en'
import fr from './fr'
import es from './es'
import ar from './ar'
import zh from './zh'
import {getSettings, type LanguageCode} from '@/lib/settings'

export type {I18nKey}

const DICTS: Record<LanguageCode, Record<I18nKey, string>> = {ru, en, fr, es, ar, zh}

const RTL_LANGUAGES: LanguageCode[] = ['ar']

const translate = (lang: LanguageCode, key: I18nKey, params?: Record<string, string | number>): string => {
    const dict = DICTS[lang] ?? ru
    let str = dict[key] ?? ru[key] ?? key
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            str = str.replaceAll(`{${k}}`, String(v))
        }
    }
    return str
};

let currentLang: LanguageCode = 'ru'

export const applyDocumentLanguage = (lang: LanguageCode): void => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = lang
    document.documentElement.dir = RTL_LANGUAGES.includes(lang) ? 'rtl' : 'ltr'
};

export const t = (key: I18nKey, params?: Record<string, string | number>): string => translate(currentLang, key, params);

export const useI18n = () => {
    const [lang, setLang] = useState<LanguageCode>('ru')

    useEffect(() => {
        const sync = () => {
            const next = getSettings().language
            currentLang = next
            applyDocumentLanguage(next)
            setLang(next)
        }
        sync()
        window.addEventListener('susu:settings', sync)
        return () => window.removeEventListener('susu:settings', sync)
    }, [])

    return {
        t: (key: I18nKey, params?: Record<string, string | number>) => translate(lang, key, params),
        locale: lang,
    }
};
