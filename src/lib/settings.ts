'use client'

import {useEffect, useState} from 'react'
import {readRaw, storageKeys, writeRaw} from './token-store'
import type {TileSize} from '@/services/types'

export type PassButtonMode = 'fab' | 'navbar'

export interface TileConfig {
    size: TileSize
    enabled: boolean
}

export interface Settings {
    feedEnabled: boolean
    passButtonMode: PassButtonMode
    notifications: boolean
    tiles: Record<string, TileConfig>
}

const DEFAULTS: Settings = {
    feedEnabled: true,
    passButtonMode: 'fab',
    notifications: true,
    tiles: {},
}

export const getSettings = (): Settings => {
    const raw = readRaw(storageKeys.settings)
    if (!raw) return {...DEFAULTS}
    try {
        return {...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>)}
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
    }

    return {settings, update}
};
