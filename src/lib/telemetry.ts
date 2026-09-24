'use client'
// Лёгкий маячок для статистики использования настроек

import {getAccessToken, getIdentity} from './token-store'

export type TelemetryEvent = 'theme' | 'passButtonMode' | 'tileResize' | 'notifications' | 'feedEnabled' | 'language'

export const sendTelemetry = (event: TelemetryEvent, value: string): void => {
    const token = getAccessToken()
    const identity = getIdentity()
    if (!token || typeof fetch === 'undefined') return
    try {
        void fetch('/api/telemetry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Client-Identity': identity,
            },
            body: JSON.stringify({event, value}),
            keepalive: true,
        }).catch(() => {
        })
    } catch {
    }
};
