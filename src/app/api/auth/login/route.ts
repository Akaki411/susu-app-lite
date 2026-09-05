// POST /api/auth/login - проксирует к внешнему API и нормализует ответ

import {withApi} from '@/backend/api-middleware'
import {error, json} from '@/backend/http'
import {login, normalizeProfile} from '@/backend/susu-client'
import type {LoginResult} from '@/shared/types'

export async function POST(request: Request): Promise<Response> {
    return withApi(request, async () => {
        const body = (await request.json().catch(() => null)) as
            | { identity?: string; login?: string; password?: string }
            | null
        if (!body?.identity || !body.login || !body.password) {
            return error('Не заполнены поля входа', 400)
        }

        let raw
        try {
            raw = await login(body.identity, body.login, body.password)
        } catch {
            const failed: LoginResult = {ok: false, message: 'Сервер недоступен'}
            return json(failed, 502)
        }

        if (!raw.isLogged || !raw.accessToken || !raw.refreshToken) {
            const failed: LoginResult = {ok: false, message: raw.translatedMessage ?? raw.message ?? 'Ошибка входа'}
            return json(failed, 401)
        }

        const profile = normalizeProfile(raw)
        const result: LoginResult = {
            ok: true,
            tokens: {accessToken: raw.accessToken, refreshToken: raw.refreshToken},
            profile: profile ?? undefined,
        }
        return json(result, 200)
    })
}
