// Безопасность бэкенда: security-заголовки, базовый rate-limit, валидаторы входных параметров

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const isGuid = (value: string | null | undefined): value is string =>
    typeof value === 'string' && GUID_RE.test(value)

export const isIsoDate = (value: string | null | undefined): value is string =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

const SUSU_HOST_RE = /^(www\.)?susu\.ru$/i

export const isSusuLink = (value: string | null | undefined): value is string => {
    if (!value) return false
    try {
        const url = new URL(value)
        return (url.protocol === 'http:' || url.protocol === 'https:') && SUSU_HOST_RE.test(url.hostname)
    } catch {
        return false
    }
}

export const intInRange = (value: string | null, min: number, max: number, fallback: number): number => {
    const n = Number(value)
    if (!Number.isInteger(n) || n < min || n > max) return fallback
    return n
}

export const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-site',
}

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120
const buckets = new Map<string, { count: number; resetAt: number }>()

setInterval(() => {
    const now = Date.now()
    for (const [ip, b] of buckets) if (b.resetAt <= now) buckets.delete(ip)
}, WINDOW_MS).unref?.()

export const rateLimit = (ip: string): boolean => {
    const now = Date.now()
    const b = buckets.get(ip)
    if (!b || b.resetAt <= now) {
        buckets.set(ip, {count: 1, resetAt: now + WINDOW_MS})
        return true
    }
    b.count++
    return b.count <= MAX_PER_WINDOW
}
