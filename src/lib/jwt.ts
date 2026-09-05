'use client'

interface JwtPayload {
    exp?: number
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string
}

export const decodeJwt = (token: string | null): JwtPayload | null => {
    if (!token) return null
    try {
        const part = token.split('.')[1]
        if (!part) return null
        const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
        const json = decodeURIComponent(
            atob(b64)
                .split('')
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join(''),
        )
        return JSON.parse(json) as JwtPayload
    } catch {
        return null
    }
};

export const userNameFromToken = (token: string | null): string | null => decodeJwt(token)?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? null;

export const isTokenExpired = (token: string | null, secondsBefore = 30): boolean => {
    const exp = decodeJwt(token)?.exp
    if (!exp) return true
    return Date.now() / 1000 >= exp - secondsBefore
};
