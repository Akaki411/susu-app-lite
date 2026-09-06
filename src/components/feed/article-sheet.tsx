'use client'
// Всплывающее окно-читалка статьи, апстрим новостей не отдаёт тело статьи -
// полный текст парсится отдельно на бэкенде (см. src/backend/article.ts) и приходит готовым HTML

import {useEffect, useState, type MouseEvent} from 'react'
import {ImageViewer} from '@/components/common/image-viewer.tsx'
import {Sheet} from '@/components/common/sheet.tsx'
import {Icon} from '@/components/common/icons'
import {useI18n} from '@/i18n'
import {getArticle} from '@/lib/api-client'
import type {NewsArticle, NewsItem} from '@/shared/types'

export const ArticleSheet = ({item, onClose}: { item: NewsItem | null; onClose: () => void }) => {
    const {t} = useI18n()
    const [article, setArticle] = useState<NewsArticle | null>(null)
    const [failed, setFailed] = useState(false)
    const [viewerImage, setViewerImage] = useState<{ src: string; alt: string } | null>(null)

    useEffect(() => {
        if (!item) return
        setArticle(null)
        setFailed(false)
        let cancelled = false
        getArticle(item.link)
            .then((a) => {
                if (!cancelled) setArticle(a)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })
        return () => {
            cancelled = true
        }
    }, [item])

    const share = () => {
        if (!item) return
        if (navigator.share) void navigator.share({title: article?.title ?? item.title, url: item.link})
        else void navigator.clipboard?.writeText(item.link)
    }

    const onContentClick = (e: MouseEvent<HTMLDivElement>) => {
        if (e.target instanceof HTMLImageElement) {
            setViewerImage({src: e.target.src, alt: e.target.alt})
        }
    }

    return (
        <>
            <Sheet open={item != null} onClose={onClose} title={t('feed.readerTitle')}>
                {!item ? null : failed ? (
                    <div className="empty-state">{t('feed.articleError')}</div>
                ) : !article ? (
                    <div className="empty-state empty-state--compact">{t('common.loading')}</div>
                ) : (
                    <div className="article-reader">
                        {article.image && (
                            <button
                                type="button"
                                className="article-reader__image-btn"
                                aria-label={t('feed.viewImage')}
                                onClick={() => setViewerImage({src: article.image!, alt: article.title})}
                            >
                                <img src={article.image} alt="" className="article-reader__image"/>
                            </button>
                        )}
                        <h1 className="article-reader__title">{article.title}</h1>
                        <div className="article-reader__meta">
                            <span>
                                {new Date(item.date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}
                            </span>
                            <button type="button" onClick={share} className="article-reader__share">
                                <Icon name="share" className="article-reader__share-icon"/>
                                {t('feed.share')}
                            </button>
                        </div>
                        <div
                            className="article-reader__content"
                            onClick={onContentClick}
                            dangerouslySetInnerHTML={{__html: article.contentHtml}}
                        />
                    </div>
                )}
            </Sheet>
            <ImageViewer
                src={viewerImage?.src ?? null}
                alt={viewerImage?.alt ?? ''}
                onClose={() => setViewerImage(null)}
            />
        </>
    )
}
