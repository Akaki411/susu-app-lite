'use client'

import {useEffect, useState} from 'react'
import {sendTelemetry} from './telemetry'
import {readRaw, storageKeys, writeRaw} from './token-store'

export type Theme = 'system' | 'light' | 'dark'

export const getStoredTheme = (): Theme => {
    const v = readRaw(storageKeys.theme)
    return v === 'light' || v === 'dark' ? v : 'system'
};

export const applyTheme = (theme: Theme): void => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
};

export const setTheme = (theme: Theme): void => {
    writeRaw(storageKeys.theme, theme)
    applyTheme(theme)
    sendTelemetry('theme', theme)
};

export const isDarkActive = (): boolean => {
    const t = getStoredTheme()
    if (t === 'dark') return true
    if (t === 'light') return false
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
};

export const useTheme = () => {
    const [theme, setThemeState] = useState<Theme>('system')
    const [dark, setDark] = useState(false)

    useEffect(() => {
        setThemeState(getStoredTheme())
        setDark(isDarkActive())
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => {
            if (getStoredTheme() === 'system') setDark(mq.matches)
        }
        mq.addEventListener('change', onChange)
        return () => mq.removeEventListener('change', onChange)
    }, [])

    const change = (t: Theme) => {
        setTheme(t)
        setThemeState(t)
        setDark(isDarkActive())
    }

    const toggle = () => change(dark ? 'light' : 'dark')

    return {theme, dark, setTheme: change, toggle}
};
