// Кеш ответов внешнего API

import {config} from './env'
import {getRedis} from './redis'

export interface Cache {
    getJson: <T>(key: string) => Promise<T | null>
    setJson: (key: string, value: unknown, ttlSec: number) => Promise<void>
}

const createMemoryCache = (): Cache => {
    const store = new Map<string, { value: unknown; expiresAt: number }>()

    setInterval(() => {
        const now = Date.now()
        for (const [k, v] of store) if (v.expiresAt <= now) store.delete(k)
    }, 60_000).unref?.()

    return {
        async getJson<T>(key: string): Promise<T | null> {
            const hit = store.get(key)
            if (!hit) return null
            if (hit.expiresAt <= Date.now()) {
                store.delete(key)
                return null
            }
            return hit.value as T
        },
        async setJson(key, value, ttlSec) {
            store.set(key, {value, expiresAt: Date.now() + ttlSec * 1000})
        },
    }
}

const createRedisCache = (): Cache => ({
    async getJson<T>(key: string): Promise<T | null> {
        const redis = await getRedis()
        const raw = await redis.get(key)
        if (raw == null) return null
        try {
            return JSON.parse(raw) as T
        } catch {
            return null
        }
    },
    async setJson(key, value, ttlSec) {
        const redis = await getRedis()
        await redis.set(key, JSON.stringify(value), {EX: ttlSec})
    },
})

export const cache: Cache = config.isDev ? createMemoryCache() : createRedisCache()
