// POST /api/auth/refresh - рефреш инициирует клиент при 401, токены остаются на клиенте

import {withApi} from '@/backend/api-middleware'
import {error, json} from '@/backend/http'
import {refresh} from '@/backend/susu-client'

export const POST = async (request: Request): Promise<Response> => withApi(request, async () => {
    const body = (await request.json().catch(() => null)) as
        | { userName?: string; identity?: string; refreshToken?: string }
        | null
    if (!body?.userName || !body.identity || !body.refreshToken) {
        return error('Недостаточно данных для продления сессии', 400)
    }

    let upd
    try {
        upd = await refresh(body.userName, body.identity, body.refreshToken)
    } catch {
        return error('Сервер недоступен', 502)
    }

    if (!upd.isLogged || !upd.accessToken || !upd.refreshToken) {
        return json({ok: false}, 401)
    }

    return json({ok: true, accessToken: upd.accessToken, refreshToken: upd.refreshToken}, 200)
});
