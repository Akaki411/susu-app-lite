// GET /api/debts - графики ликвидации задолженностей

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {config} from '@/backend/env'
import {error, getBearer, json} from '@/backend/http'
import {userIdFromAuth} from '@/backend/jwt'
import {getDebtSchedules} from '@/backend/susu-client'
import type {DebtSchedule} from '@/shared/types'

export const GET = async (request: Request): Promise<Response> => withApi(request, async () => {
    const bearer = getBearer(request)
    if (!bearer) return error('Требуется авторизация', 401)

    const userId = userIdFromAuth(bearer) ?? 'anon'
    const cacheKey = `debts:${userId}`

    let data = await cache.getJson<DebtSchedule[]>(cacheKey)
    if (!data) {
        data = await getDebtSchedules(bearer)
        await cache.setJson(cacheKey, data, config.ratingTtl)
    }
    return json(data, 200)
});
