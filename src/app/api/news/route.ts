// GET /api/news?page=N - страница ленты для постепенной подгрузки

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {error, getBearer, json} from '@/backend/http'
import {fetchNews} from '@/backend/news'
import {intInRange} from '@/backend/security'
import type {NewsPage} from '@/shared/types'

const NEWS_TTL = 300

export const GET = async (request: Request): Promise<Response> => withApi(request, async () => {
    const bearer = getBearer(request)
    if (!bearer) return error('Требуется авторизация', 401)

    const page = intInRange(new URL(request.url).searchParams.get('page'), 0, 100000, 0)
    const cacheKey = `news:page:${page}`
    const cached = await cache.getJson<NewsPage>(cacheKey)
    if (cached) return json(cached, 200)

    const data = await fetchNews(page, bearer)
    if (data.items.length > 0) await cache.setJson(cacheKey, data, NEWS_TTL)
    return json(data, 200)
});
