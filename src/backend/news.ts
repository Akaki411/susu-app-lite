// Клиент новостей, тот же шлюз, что и расписание/рейтинг

import {config} from './env'
import type {NewsItem, NewsPage} from '../shared/types'

const UPSTREAM_TIMEOUT_MS = 12_000

interface RawNewsItem {
    title?: string
    contentLink?: string
    imageLink?: string
    publicationDate?: string
}

const idFromLink = (link: string): string => {
    const segments = link.split('/').filter(Boolean)
    return segments[segments.length - 1] ?? link
}

const isoDate = (raw: string | undefined): string => {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw ?? '')
    return m ? `${m[3]}-${m[2]}-${m[1]}` : new Date().toISOString().slice(0, 10)
}

const normalize = (raw: RawNewsItem): NewsItem => {
    const link = raw.contentLink ?? ''
    return {
        id: idFromLink(link),
        date: isoDate(raw.publicationDate),
        title: (raw.title ?? '').trim(),
        image: raw.imageLink,
        link,
    }
}

export const fetchNews = async (page: number, bearer: string): Promise<NewsPage> => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS)
    try {
        const res = await fetch(`${config.susuBase}/api/News/GetNews?lang=ru&page=${page}`, {
            headers: {Authorization: bearer, Accept: 'application/json'},
            signal: ctrl.signal,
        })
        if (res.status !== 200) return {items: [], page, hasMore: false}
        const raw = (await res.json().catch(() => [])) as RawNewsItem[]
        const items = Array.isArray(raw) ? raw.map(normalize) : []
        return {items, page, hasMore: items.length > 0}
    } finally {
        clearTimeout(timer)
    }
}
