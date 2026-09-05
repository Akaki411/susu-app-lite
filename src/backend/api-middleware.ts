// Общая обвязка для всех API-роутов Rari

import {getClientIp} from './client-ip'
import {recordRequest} from './db/repo'
import {trackUniqueIp} from './hll'
import {error} from './http'
import {rateLimit, securityHeaders} from './security'

export const withApi = async (request: Request, handler: () => Promise<Response>): Promise<Response> => {
    const url = new URL(request.url)
    const ip = getClientIp(request)

    if (!rateLimit(ip)) return error('Слишком много запросов', 429)

    recordRequest(url.pathname)
    void trackUniqueIp(ip)

    try {
        const res = await handler()
        for (const [k, v] of Object.entries(securityHeaders)) {
            if (!res.headers.has(k)) res.headers.set(k, v)
        }
        return res
    } catch (e) {
        console.error('[api]', request.method, url.pathname, e instanceof Error ? e.message : e)
        return error('Внутренняя ошибка', 500)
    }
}
