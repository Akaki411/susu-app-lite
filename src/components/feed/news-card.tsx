// Карточка новости в ленте

import {memo} from 'react'
import type {NewsItem} from '@/shared/types'

const NewsCardBase = ({item, onOpen}: { item: NewsItem; onOpen: (item: NewsItem) => void }) => (
    <button type="button" onClick={() => onOpen(item)} className="news-card">
        {item.image && <img src={item.image} alt="" loading="lazy" decoding="async" className="news-card__image"/>}
        <div className="news-card__body">
            <div className="news-card__date">
                {new Date(item.date).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'})}
            </div>
            <h3 className="news-card__title">{item.title}</h3>
        </div>
    </button>
)

export const NewsCard = memo(NewsCardBase)
