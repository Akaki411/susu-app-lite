// GET /api/rating/journal?disciplineId=<guid>&term=<1..12> - детали по дисциплине

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {config} from '@/backend/env'
import {error, getBearer, json} from '@/backend/http'
import {userIdFromAuth} from '@/backend/jwt'
import {intInRange, isGuid} from '@/backend/security'
import {getJournal} from '@/backend/susu-client'
import type {RatingJournal} from '@/shared/types'

export const GET = async (request: Request): Promise<Response> => withApi(request, async () => {
    const bearer = getBearer(request)
    if (!bearer) return error('Требуется авторизация', 401)

    const url = new URL(request.url)
    const disciplineId = url.searchParams.get('disciplineId')
    const term = intInRange(url.searchParams.get('term'), 1, 12, 1)
    if (!isGuid(disciplineId)) return error('Некорректный id дисциплины', 400)

    const userId = userIdFromAuth(bearer) ?? 'anon'
    const cacheKey = `journal:${userId}:${disciplineId}:${term}`

    let data = await cache.getJson<RatingJournal>(cacheKey)
    if (!data) {
        data = await getJournal(disciplineId, term, bearer)
        if (!data) return error('Не удалось получить детализацию', 502)
        await cache.setJson(cacheKey, data, config.ratingTtl)
    }
    return json(data, 200)
});
