// Разбор содержимого JWT без проверки подписи

interface JwtPayload {
    Id?: string
    exp?: number
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
}

export const decodeJwt = (token: string | null | undefined): JwtPayload | null => {
    if (!token) return null
    try {
        const part = token.split('.')[1]
        if (!part) return null
        const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
        const json = Buffer.from(b64, 'base64').toString('utf-8')
        return JSON.parse(json) as JwtPayload
    } catch {
        return null
    }
}

export const userIdFromAuth = (authHeader: string | null): string | null => {
    if (!authHeader) return null
    const token = authHeader.replace(/^Bearer\s+/i, '')
    return decodeJwt(token)?.Id ?? null
}

export const roleFromToken = (token: string | null | undefined): string | null =>
    decodeJwt(token)?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null
