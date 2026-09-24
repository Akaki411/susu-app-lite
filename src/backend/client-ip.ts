// Определение уникального идентификатора или реального IP клиента

import {createHash} from 'node:crypto'
import {config} from './env'
import {userIdFromAuth} from './jwt'

const PRIVATE_IP_RE =
    /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|fc00:|[0:]+1)$/i

const isPublicIp = (ip: string): boolean => {
    if (!ip || ip === 'unknown') return false
    return !PRIVATE_IP_RE.test(ip)
}

export const getClientIp = (req: Request): string => {
    // 1. Клиентский идентификатор устройства (от нашего фронтенда / PWA)
    const clientIdentity = req.headers.get('x-client-identity')?.trim()
    if (clientIdentity && clientIdentity.length >= 8 && clientIdentity.length <= 64) {
        return `id:${clientIdentity}`
    }

    // 2. Идентификатор авторизованного пользователя из JWT токена
    const userId = userIdFromAuth(req.headers.get('authorization'))
    if (userId) {
        return `user:${userId}`
    }

    // 3. Проверка на реальный публичный IP из заголовков прокси / CDN
    const headersToCheck = [
        config.trustedIpHeader,
        'cf-connecting-ip',
        'x-real-ip',
        'x-forwarded-for',
    ]

    for (const h of headersToCheck) {
        if (!h) continue
        const raw = req.headers.get(h)
        if (!raw) continue
        for (const part of raw.split(',')) {
            const ip = part.trim()
            if (isPublicIp(ip)) {
                return `ip:${ip}`
            }
        }
    }

    // 4. Если запрос пришёл через внутренний туннель (10.8.0.1) без clientIdentity,
    // формируем отпечаток на основе User-Agent и Accept-Language
    const ua = req.headers.get('user-agent') ?? ''
    const lang = req.headers.get('accept-language') ?? ''
    if (ua || lang) {
        const fp = createHash('sha256').update(`${ua}|${lang}`).digest('hex').slice(0, 16)
        return `fp:${fp}`
    }

    // 5. Запасной фоллбек
    const fallback = req.headers.get(config.trustedIpHeader)?.split(',')[0]?.trim()
    return fallback || 'unknown'
}
