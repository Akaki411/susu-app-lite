// Утилиты для формирования HTTP-ответов API-роутов

import {securityHeaders} from './security'

export const json = (data: unknown, status = 200): Response =>
    new Response(JSON.stringify(data), {
        status,
        headers: {'Content-Type': 'application/json; charset=utf-8', ...securityHeaders},
    })

export const error = (message: string, status = 400): Response => json({error: message}, status)

export const getBearer = (req: Request): string | null => {
    const h = req.headers.get('authorization')
    return h && /^Bearer\s+/i.test(h) ? h : null
}
