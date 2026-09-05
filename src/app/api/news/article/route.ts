// GET /api/news/article?link=<susu.ru URL> - получить полный текст статьи (обработчик в src/backend/article.ts)

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {fetchArticleBody} from '@/backend/article'
import {error, getBearer, json} from '@/backend/http'
import {isSusuLink} from '@/backend/security'

const ARTICLE_TTL = 3600

export async function GET(request: Request): Promise<Response> {
    return withApi(request, async () => {
        if (!getBearer(request)) return error('Требуется авторизация', 401)

        const link = new URL(request.url).searchParams.get('link')
        if (!isSusuLink(link)) return error('Некорректная ссылка на статью', 400)

        const cacheKey = `news:article:${link}`
        const cached = await cache.getJson(cacheKey)
        if (cached) return json(cached, 200)

        const article = await fetchArticleBody(link)
        if (!article) return error('Не удалось получить статью', 502)
        await cache.setJson(cacheKey, article, ARTICLE_TTL)
        return json(article, 200)
    })
}
