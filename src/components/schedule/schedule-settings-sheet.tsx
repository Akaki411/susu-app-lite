'use client'
// Настройки расписания: вид (по датам / по неделям) и единый поиск источника

import {useEffect, useRef, useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'
import {searchSchedule} from '@/lib/api-client'
import {getRecentScheduleSources, type ScheduleSource} from '@/lib/schedule-source'
import type {ScheduleSearchResult, ScheduleSourceKind} from '@/shared/types'

type Mode = 'dates' | 'weeks'

const KIND_LABEL_KEY: Record<ScheduleSourceKind, 'schedule.kindGroup' | 'schedule.kindInstructor' | 'schedule.kindRoom'> = {
    group: 'schedule.kindGroup',
    instructor: 'schedule.kindInstructor',
    room: 'schedule.kindRoom',
}

const sameSource = (a: ScheduleSource | null, b: ScheduleSource): boolean => !!a && a.kind === b.kind && a.id === b.id

const SEARCH_DEBOUNCE_MS = 450

export const ScheduleSettingsSheet = ({
    open,
    onClose,
    mode,
    onModeChange,
    onSourceChange,
    own,
    current,
}: {
    open: boolean
    onClose: () => void
    mode: Mode
    onModeChange: (m: Mode) => void
    onSourceChange: (s: ScheduleSource) => void
    own: ScheduleSource | null
    current: ScheduleSource | null
}) => {
    const {t} = useI18n()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ScheduleSearchResult[]>([])
    const [recent, setRecent] = useState<ScheduleSource[]>([])
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (open) setRecent(getRecentScheduleSources())
    }, [open])

    useEffect(() => {
        if (timer.current) clearTimeout(timer.current)
        const q = query.trim()
        if (q.length < 2) {
            setResults([])
            return
        }
        timer.current = setTimeout(async () => {
            try {
                setResults(await searchSchedule(q))
            } catch {
                setResults([])
            }
        }, SEARCH_DEBOUNCE_MS)
        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [query])

    const pick = (s: ScheduleSource) => {
        onSourceChange(s)
        setQuery('')
        setResults([])
        onClose()
    }

    return (
        <Sheet open={open} onClose={onClose} title={t('schedule.settings')}>
            <div className="section-title">{t('schedule.viewMode')}</div>
            <div className="segmented">
                {(['dates', 'weeks'] as Mode[]).map((m) => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => onModeChange(m)}
                        className={`segmented__option${mode === m ? ' segmented__option--active' : ''}`}
                    >
                        {m === 'dates' ? t('schedule.modeDates') : t('schedule.modeWeeks')}
                    </button>
                ))}
            </div>

            <div className="section-title section-title--spaced">{t('schedule.source')}</div>

            {query.trim().length < 2 && recent.length > 0 && (
                <div className="schedule-settings__recent">
                    {recent.map((r) => {
                        const active = sameSource(current, r)
                        return (
                            <button
                                key={`${r.kind}-${r.id}`}
                                type="button"
                                onClick={() => pick(r)}
                                className={`schedule-settings__recent-card${active ? ' schedule-settings__recent-card--active' : ''}`}
                            >
                                <span className={`schedule-settings__recent-title${active ? ' schedule-settings__recent-title--active' : ''}`}>
                                    {r.title}
                                </span>
                                <span className={`schedule-settings__recent-hint${active ? ' schedule-settings__recent-hint--active' : ''}`}>
                                    {r.subtitle || t(KIND_LABEL_KEY[r.kind])}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}

            <input
                className="schedule-settings__search"
                placeholder={t('schedule.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoCapitalize="none"
                spellCheck={false}
            />

            {query.trim().length >= 2 ? (
                <div className="schedule-settings__results">
                    {results.map((r) => (
                        <button
                            key={`${r.kind}-${r.id}`}
                            type="button"
                            onClick={() => pick({id: r.id, kind: r.kind, title: r.title, subtitle: r.subtitle})}
                            className="schedule-settings__result"
                        >
                            <span className="schedule-settings__result-title">{r.title}</span>
                            {r.subtitle && <span className="schedule-settings__result-subtitle">{r.subtitle}</span>}
                        </button>
                    ))}
                </div>
            ) : (
                own && (
                    <button type="button" onClick={() => pick(own)} className="radio-row">
                        <span className={`radio-row__dot${sameSource(current, own) ? ' radio-row__dot--active' : ''}`}>
                            {sameSource(current, own) && <span className="radio-row__dot-fill"/>}
                        </span>
                        <span className={`radio-row__label${sameSource(current, own) ? ' radio-row__label--active' : ''}`}>
                            {t('schedule.mySchedule')}
                        </span>
                        <span className="radio-row__hint">{own.title}</span>
                    </button>
                )
            )}
        </Sheet>
    )
};
