// GET /api/qr?data=<passTicket> - SSR-генерация QR-кода пропуска с логотипом

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {error} from '@/backend/http'
import {generateQrSvg} from '@/backend/qr'
import {securityHeaders} from '@/backend/security'

const SAFE_DATA_RE = /^[\w\-.:/ ]{1,256}$/

export const GET = async (request: Request): Promise<Response> => withApi(request, async () => {
    const data = new URL(request.url).searchParams.get('data') ?? ''
    if (!SAFE_DATA_RE.test(data)) return error('Некорректные данные для QR', 400)

    const cacheKey = `qr:${data}`
    let svg = await cache.getJson<string>(cacheKey)
    if (!svg) {
        svg = await generateQrSvg(data)
        await cache.setJson(cacheKey, svg, 3600)
    }

    return new Response(svg, {
        status: 200,
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'private, max-age=3600',
            ...securityHeaders,
        },
    })
});
