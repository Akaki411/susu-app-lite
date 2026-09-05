'use client'
// Экран Рейтинг
//
// Семестр и предметы читаются из IndexedDB, затем обновляются в фоне

import {useState} from 'react'
import {PageHeader} from '@/components/common/page-header.tsx'
import {JournalSheet} from '@/components/rating/journal-sheet.tsx'
import {RatingRow} from '@/components/rating/rating-row.tsx'
import {TermSheet} from '@/components/rating/term-sheet.tsx'
import {useI18n} from '@/i18n'
import {getRating, getStudyPlan} from '@/lib/api-client'
import {groupRatingByCategory} from '@/lib/rating-utils'
import {readRaw, writeRaw} from '@/lib/token-store'
import {useOfflineData} from '@/lib/swr'
import {useSwipe} from '@/lib/use-swipe'
import type {RatingData, RatingSubject, StudyPlan} from '@/shared/types'

const TERM_KEY = 'susu_rating_term'

export default () => {
    const {t} = useI18n()
    const [termOpen, setTermOpen] = useState(false)
    const [openSubject, setOpenSubject] = useState<RatingSubject | null>(null)
    const [term, setTerm] = useState<number>(() => Number(readRaw(TERM_KEY)) || 0)

    const {data: plan} = useOfflineData<StudyPlan>({
        store: 'misc',
        cacheKey: 'studyplan',
        fetcher: () => getStudyPlan(),
    })

    const activeTerm = term || plan?.currentTerm || 1

    const {data, refreshing, refresh} = useOfflineData<RatingData>({
        store: 'rating',
        cacheKey: `rating:${activeTerm}`,
        fetcher: (force) => getRating(activeTerm, force),
    })

    const {handlers, pullDistance} = useSwipe({onPullRefresh: () => void refresh(true)})

    const subjects = data?.subjects ?? []

    const pickTerm = (n: number) => {
        setTerm(n)
        writeRaw(TERM_KEY, String(n))
    }

    return (
        <div className="screen" {...handlers}>
            <div className="screen__header">
                <PageHeader
                    title={t('rating.title')}
                    subtitle={`${t('rating.term', {n: activeTerm})}`}
                    actions={[{icon: 'settings', label: t('rating.selectTerm'), onClick: () => setTermOpen(true)}]}
                />
            </div>

            {(pullDistance > 0 || refreshing) && (
                <div className="pull-refresh" style={{height: Math.max(pullDistance, refreshing ? 28 : 0)}}>
                    {refreshing ? <span className="spinner"/> : t('schedule.pullToRefresh')}
                </div>
            )}

            <div className="rating__body">
                {subjects.length > 0 ? (
                    <div className="rating__groups">
                        {groupRatingByCategory(subjects).map((group) => (
                            <div key={group.category} className="rating__group">
                                <div className="section-title section-title--tight">
                                    {t(`rating.category.${group.category}`)}
                                </div>
                                <div className="rating__group-list">
                                    {group.items.map((s) => (
                                        <RatingRow key={`${s.disciplineId}-${s.controlType}`} subject={s} onOpen={setOpenSubject}/>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">{t('rating.noScores')}</div>
                )}
            </div>

            <TermSheet
                open={termOpen}
                onClose={() => setTermOpen(false)}
                termCount={plan?.termCount ?? 8}
                currentTerm={plan?.currentTerm ?? 1}
                selected={activeTerm}
                onPick={pickTerm}
            />
            <JournalSheet subject={openSubject} term={activeTerm} onClose={() => setOpenSubject(null)}/>
        </div>
    )
}
