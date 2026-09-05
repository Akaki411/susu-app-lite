'use client'

import ru, {type I18nKey} from './ru'

export type {I18nKey}

const dictionary: Record<string, string> = ru

export const t = (key: I18nKey, params?: Record<string, string | number>): string => {
    let str = dictionary[key] ?? key
    if (params) {
        for (const [k, v] of Object.entries(params)) {
            str = str.replaceAll(`{${k}}`, String(v))
        }
    }
    return str
};

export const useI18n = () => ({t, locale: 'ru' as const});
