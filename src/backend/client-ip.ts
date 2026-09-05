// Определение реального IP клиента

import {config} from './env'

export const getClientIp = (req: Request): string => {
    const header = req.headers.get(config.trustedIpHeader)
    if (header) {
        const first = header.split(',')[0]?.trim()
        if (first) return first
    }
    return 'unknown'
}
