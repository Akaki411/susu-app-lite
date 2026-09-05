'use client'
// Экран «Лента»
//
// Число колонок на ПК считается по реальной ширине контейнера (при помощи ResizeObserver), а не по
// фиксированным брейкпоинтам — иначе на широких мониторах карточки не заполняют всю ширину
// и справа остаётся пустая полоса.

import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useWindowVirtualizer} from '@tanstack/react-virtual'
import {PageHeader} from '@/components/common/page-header.tsx'
import {ArticleSheet} from '@/components/feed/article-sheet.tsx'
import {NewsCard} from '@/components/feed/news-card.tsx'
import {useI18n} from '@/i18n'
import {getNews} from '@/lib/api-client'
import type {NewsItem} from '@/shared/types'

const ROW_ESTIMATE = 240
const MIN_CARD_WIDTH = 260
const MAX_COLUMNS = 6
const GAP = 12

export default () => {
    const {t} = useI18n()
    const [items, setItems] = useState<NewsItem[]>([])
    const [nextPage, setNextPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [offline, setOffline] = useState(false)
    const [columns, setColumns] = useState(1)
    const [scrollMargin, setScrollMargin] = useState(0)
    const [openItem, setOpenItem] = useState<NewsItem | null>(null)
    const sentinelRef = useRef<HTMLDivElement | null>(null)
    const bodyRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return
        setLoading(true)
        try {
            const res = await getNews(nextPage)
            setItems((prev) => [...prev, ...res.items])
            setHasMore(res.hasMore)
            setNextPage((p) => p + 1)
            setOffline(false)
        } catch {
            setOffline(items.length === 0)
            setHasMore(false)
        } finally {
            setLoading(false)
        }
    }, [nextPage, loading, hasMore])

    useEffect(() => {
        void loadMore()
    }, [])

    useEffect(() => {
        const el = bodyRef.current
        if (!el) return
        const update = () => {
            const width = el.clientWidth
            const next = Math.max(1, Math.min(MAX_COLUMNS, Math.floor((width + GAP) / (MIN_CARD_WIDTH + GAP))))
            setColumns(next)
            setScrollMargin(listRef.current?.offsetTop ?? el.offsetTop)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void loadMore()
            },
            {rootMargin: '600px'},
        )
        io.observe(el)
        return () => io.disconnect()
    }, [loadMore])

    const rows = useMemo(() => {
        const out: NewsItem[][] = []
        for (let i = 0; i < items.length; i += columns) out.push(items.slice(i, i + columns))
        return out
    }, [items, columns])

    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => ROW_ESTIMATE,
        overscan: 4,
        scrollMargin,
    })

    return (
        <div className="screen">
            <div className="screen__header">
                <PageHeader title={t('feed.title')} subtitle={t('feed.subtitle')}/>
            </div>
            <div className="feed__body" ref={bodyRef}>
                {items.length === 0 && offline ? (
                    <div className="empty-state">{t('feed.emptyOffline')}</div>
                ) : items.length === 0 && !loading && !hasMore ? (
                    <div className="empty-state">{t('feed.empty')}</div>
                ) : (
                    <div ref={listRef} style={{position: 'relative', height: rowVirtualizer.getTotalSize()}}>
                        {rowVirtualizer.getVirtualItems().map((vRow) => (
                            <div
                                key={vRow.key}
                                data-index={vRow.index}
                                ref={rowVirtualizer.measureElement}
                                className="feed__row"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    gap: GAP,
                                    transform: `translateY(${vRow.start - scrollMargin}px)`,
                                }}
                            >
                                {rows[vRow.index]!.map((item) => (
                                    <NewsCard key={item.id} item={item} onOpen={setOpenItem}/>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
                <div ref={sentinelRef} className="feed__sentinel"/>
                {loading && <div className="empty-state empty-state--compact">{t('common.loading')}</div>}
            </div>
            <ArticleSheet item={openItem} onClose={() => setOpenItem(null)}/>
        </div>
    )
}
