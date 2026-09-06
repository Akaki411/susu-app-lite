'use client'

import {useEffect, useState} from 'react'
import {sendTelemetry} from './telemetry'
import {readRaw, storageKeys, writeRaw} from './token-store'
import type {TileSize} from '@/services/types'

export type PassButtonMode = 'fab' | 'navbar'

export type LanguageCode = 'ru' | 'en' | 'fr' | 'es' | 'ar' | 'zh'

export interface LanguageOption {
    code: LanguageCode
    label: string
    flag: string
}

export const LANGUAGES: LanguageOption[] = [
    {code: 'ru', label: 'Русский', flag: '🇷🇺'},
    {code: 'en', label: 'English', flag: '🇬🇧'},
    {code: 'fr', label: 'Français', flag: '🇫🇷'},
    {code: 'es', label: 'Español', flag: '🇪🇸'},
    {code: 'ar', label: 'العربية', flag: '🇸🇦'},
    {code: 'zh', label: '中文', flag: '🇨🇳'},
]

const isLanguageCode = (v: unknown): v is LanguageCode => LANGUAGES.some((l) => l.code === v)

export interface TileConfig {
    size: TileSize
    enabled: boolean
}

export interface Settings {
    feedEnabled: boolean
    passButtonMode: PassButtonMode
    notifications: boolean
    language: LanguageCode
    tiles: Record<string, TileConfig>
}

const DEFAULTS: Settings = {
    feedEnabled: true,
    passButtonMode: 'fab',
    notifications: true,
    language: 'ru',
    tiles: {},
}

export const getSettings = (): Settings => {
    const raw = readRaw(storageKeys.settings)
    if (!raw) return {...DEFAULTS}
    try {
        const merged = {...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>)}
        if (!isLanguageCode(merged.language)) merged.language = DEFAULTS.language
        return merged
    } catch {
        return {...DEFAULTS}
    }
};

const saveSettings = (s: Settings): void => {
    writeRaw(storageKeys.settings, JSON.stringify(s))
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('susu:settings'))
};

export const tileConfig = (settings: Settings, id: string, defaultSize: TileSize): TileConfig =>
    settings.tiles[id] ?? {size: defaultSize, enabled: true};

export const updateTile = (id: string, defaultSize: TileSize, patch: Partial<TileConfig>): void => {
    const fresh = getSettings()
    const current = tileConfig(fresh, id, defaultSize)
    saveSettings({...fresh, tiles: {...fresh.tiles, [id]: {...current, ...patch}}})
    if (patch.size != null) sendTelemetry('tileResize', String(patch.size))
};

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings>(DEFAULTS)

    useEffect(() => {
        setSettings(getSettings())
        const onChange = () => setSettings(getSettings())
        window.addEventListener('susu:settings', onChange)
        return () => window.removeEventListener('susu:settings', onChange)
    }, [])

    const update = (patch: Partial<Settings>) => {
        const next = {...getSettings(), ...patch}
        saveSettings(next)
        setSettings(next)
        if (patch.notifications != null) sendTelemetry('notifications', patch.notifications ? 'on' : 'off')
        if (patch.feedEnabled != null) sendTelemetry('feedEnabled', patch.feedEnabled ? 'on' : 'off')
        if (patch.passButtonMode != null) sendTelemetry('passButtonMode', patch.passButtonMode)
        if (patch.language != null) sendTelemetry('language', patch.language)
    }

    return {settings, update}
};
