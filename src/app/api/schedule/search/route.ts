// GET /api/schedule/search?q=<строка> - единый поиск студента/преподавателя/аудитории

import {withApi} from '@/backend/api-middleware'
import {error, getBearer, json} from '@/backend/http'
import {searchSchedules} from '@/backend/susu-client'

export async function GET(request: Request): Promise<Response> {
    return withApi(request, async () => {
        const bearer = getBearer(request)
        if (!bearer) return error('Требуется авторизация', 401)

        const q = (new URL(request.url).searchParams.get('q') ?? '').trim()
        if (q.length < 2) return json([], 200)

        const res = await searchSchedules(q, bearer)
        return json(res, 200)
    })
}
