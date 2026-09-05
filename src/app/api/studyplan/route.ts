// GET /api/studyplan - план обучения

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {config} from '@/backend/env'
import {error, getBearer, json} from '@/backend/http'
import {userIdFromAuth} from '@/backend/jwt'
import {getStudyPlan} from '@/backend/susu-client'

export async function GET(request: Request): Promise<Response> {
    return withApi(request, async () => {
        const bearer = getBearer(request)
        if (!bearer) return error('Требуется авторизация', 401)

        const userId = userIdFromAuth(bearer) ?? 'anon'
        const cacheKey = `studyplan:${userId}`
        const cached = await cache.getJson(cacheKey)
        if (cached) return json(cached, 200)

        const plan = await getStudyPlan(bearer)
        if (!plan) return json({error: 'unauthorized'}, 401)
        await cache.setJson(cacheKey, plan, config.ratingTtl)
        return json(plan, 200)
    })
}
