// Ленивое подключение к Redis, только ПРОД

import * as redisNs from 'redis'
import {config} from './env'

const createClient = ((redisNs as { default?: typeof redisNs }).default ?? redisNs).createClient

type RedisClientType = ReturnType<typeof createClient>

let client: RedisClientType | null = null
let connecting: Promise<void> | null = null

export const getRedis = async (): Promise<RedisClientType> => {
    if (!client) {
        client = createClient({
            url: config.redisUrl,
            socket: {connectTimeout: 3000, reconnectStrategy: false},
        })
        client.on('error', (e) => console.error('[redis]', e instanceof Error ? e.message : e))
    }
    if (!client.isOpen) {
        connecting ??= client.connect().then(
            () => {
                connecting = null
            },
            (e) => {
                connecting = null
                client = null
                throw e
            },
        )
        await connecting
    }
    return client
}
