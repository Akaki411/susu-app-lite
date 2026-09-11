'use client'
// Полная очистка кеша при обновлении версии приложения

import {idbClearAll} from './idb'

const VERSION_KEY = 'susu_cache_version'

const PRESERVE_KEYS = new Set<string>([
    'susu_app_token',
    'refreshToken',
    'identityToken',
    'susu_profile',
    'susu_theme',
    'susu_settings',
    VERSION_KEY,
])

const clearGeneratedLocalStorage = (): void => {
    try {
        const ls = window.localStorage
        const toRemove: string[] = []
        for (let i = 0; i < ls.length; i++) {
            const key = ls.key(i)
            if (key && !PRESERVE_KEYS.has(key)) toRemove.push(key)
        }
        for (const key of toRemove) ls.removeItem(key)
    } catch {
    }
    try {
        window.sessionStorage?.clear()
    } catch {
    }
}

let handled = false

const applyVersion = async (version: string): Promise<void> => {
    if (handled) return
    handled = true

    let stored: string | null = null
    try {
        stored = window.localStorage.getItem(VERSION_KEY)
    } catch {
    }
    if (stored === version) return

    const isUpgrade = stored !== null // null = первый запуск, чистить нечего
    let wrote = false
    try {
        window.localStorage.setItem(VERSION_KEY, version)
        wrote = true
    } catch {
    }

    clearGeneratedLocalStorage()
    await idbClearAll()

    if (isUpgrade && wrote) location.reload()
}

export const setupCacheReset = (): void => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
        const data = e.data as { type?: string; version?: string } | null
        if (data?.type === 'SW_VERSION' && typeof data.version === 'string') {
            void applyVersion(data.version)
        }
    })

    navigator.serviceWorker.ready
        .then((reg) => {
            const sw = reg.active ?? navigator.serviceWorker.controller
            sw?.postMessage({type: 'GET_VERSION'})
        })
        .catch(() => {
        })
}
