'use client'
// Панель детализации по дисциплине

import {useEffect, useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'
import {getJournal} from '@/lib/api-client'
import {colorForPercent} from '@/lib/rating-utils'
import type {JournalPoint, RatingJournal, RatingSubject} from '@/shared/types'

const PointRow = ({point}: { point: JournalPoint }) => (
    <div className="journal-point">
        <span className="journal-point__name">{point.name}</span>
        <span className="journal-point__stats">
            <span className="journal-point__score" style={{color: colorForPercent(point.rating)}}>
                {point.rating > 0 ? `${point.rating}%` : '—'}
            </span>
            <span className="journal-point__points">
                {point.point}/{point.maxPoint}
            </span>
        </span>
    </div>
)

const Section = ({title, points}: { title: string; points: JournalPoint[] }) =>
points.length === 0 ? null : (
    <div className="journal__section">
        <div className="section-title">{title}</div>
        <div className="journal__section-list">
            {points.map((p, i) => (
                <PointRow key={i} point={p}/>
            ))}
        </div>
    </div>
)

export const JournalSheet = ({
    subject,
    term,
    onClose,
}: {
    subject: RatingSubject | null
    term: number
    onClose: () => void
}) => {
    const {t} = useI18n()
    const [journal, setJournal] = useState<RatingJournal | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        if (!subject) return
        setJournal(null)
        setFailed(false)
        let cancelled = false
        getJournal(subject.disciplineId, term)
            .then((j) => {
                if (!cancelled) setJournal(j)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })
        return () => {
            cancelled = true
        }
    }, [subject, term])

    const isEmpty =
        journal != null &&
        journal.currentControl.length === 0 &&
        journal.bonuses.length === 0 &&
        journal.labs.length === 0 &&
        journal.courseWorksOrProjects.length === 0 &&
        journal.attestation.length === 0

    return (
        <Sheet open={subject != null} onClose={onClose} title={subject?.name ?? ''}>
            {!subject ? null : failed ? (
                <div className="empty-state">{t('rating.journalError')}</div>
            ) : !journal ? (
                <div className="empty-state empty-state--compact">{t('common.loading')}</div>
            ) : (
                <div className="journal">
                    <div className="journal__summary">
                        <span className="journal__summary-score" style={{color: colorForPercent(journal.totalRating)}}>
                          {journal.totalRating > 0 ? `${journal.totalRating}%` : '—'}
                        </span>
                        <span className="journal__summary-label">{t('rating.journalTotal')}</span>
                    </div>

                    <Section title={t('rating.journalCurrent')} points={journal.currentControl}/>
                    <Section title={t('rating.journalBonuses')} points={journal.bonuses}/>
                    <Section title={t('rating.journalLabs')} points={journal.labs}/>
                    <Section title={t('rating.journalCourseWork')} points={journal.courseWorksOrProjects}/>
                    <Section title={t('rating.journalAttestation')} points={journal.attestation}/>

                    {isEmpty && <div className="empty-state empty-state--compact">{t('rating.journalEmpty')}</div>}
                </div>
            )}
        </Sheet>
    )
}
