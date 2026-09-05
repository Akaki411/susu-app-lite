// GET /api/rating?term=<1..12>[&force=1] - запрос рейтингов, пользователи хранятся в кеше (ID берется из JWT) по TTL

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {config} from '@/backend/env'
import {error, getBearer, json} from '@/backend/http'
import {userIdFromAuth} from '@/backend/jwt'
import {intInRange} from '@/backend/security'
import {getRating} from '@/backend/susu-client'
import type {RatingData} from '@/shared/types'

export const GET = async (request: Request): Promise<Response> => withApi(request, async () => {
    const bearer = getBearer(request)
    if (!bearer) return error('Требуется авторизация', 401)

    const url = new URL(request.url)
    const term = intInRange(url.searchParams.get('term'), 1, 12, 1)
    const force = url.searchParams.get('force') === '1'
    const userId = userIdFromAuth(bearer) ?? 'anon'
    const cacheKey = `rating:${userId}:${term}`

    let data = force ? null : await cache.getJson<RatingData>(cacheKey)
    if (!data) {
        const subjects = await getRating(term, bearer)
        data = {term, subjects, fetchedAt: Date.now()}
        await cache.setJson(cacheKey, data, config.ratingTtl)
    }
    return json(data, 200)
});
