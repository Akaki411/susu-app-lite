// GET /api/schedule/search?q=<строка> - единый поиск студента/преподавателя/аудитории

import {withApi} from '@/backend/api-middleware'
import {error, getBearer, json} from '@/backend/http'
import {searchSchedules} from '@/backend/susu-client'
import {cache} from '@/backend/cache'
import type {ScheduleSearchResult} from '@/shared/types'

export async function GET(request: Request): Promise<Response> {
    return withApi(request, async () => {
        const bearer = getBearer(request)
        if (!bearer) return error('Требуется авторизация', 401)

        const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
        if (q.length < 2) return json([], 200)

        const cacheKey = `search:${q.toLowerCase()}`
        const cached = await cache.getJson<ScheduleSearchResult[]>(cacheKey)
        if (cached) {
            return json(cached, 200)
        }

        const res = await searchSchedules(q, bearer)
        if (res.status === 401) {
            return error('Сессия истекла', 401)
        }
        if (res.status !== 200) {
            return error('Ошибка поиска расписания', res.status >= 400 && res.status < 600 ? res.status : 502)
        }

        if (res.results.length > 0) {
            await cache.setJson(cacheKey, res.results, 600)
        }

        return json(res.results, 200)
    })
}
