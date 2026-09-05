'use client'
// Настройки расписания: вид (по датам / по неделям) и единый поиск источника

import {useEffect, useRef, useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'
import {searchSchedule} from '@/lib/api-client'
import type {ScheduleSource} from '@/lib/schedule-source'
import type {ScheduleSearchResult} from '@/shared/types'

type Mode = 'dates' | 'weeks'

export const ScheduleSettingsSheet = ({
    open,
    onClose,
    mode,
    onModeChange,
    onSourceChange,
}: {
    open: boolean
    onClose: () => void
    mode: Mode
    onModeChange: (m: Mode) => void
    onSourceChange: (s: ScheduleSource) => void
}) => {
    const {t} = useI18n()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ScheduleSearchResult[]>([])
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        }, 300)
        return () => {
            if (timer.current) clearTimeout(timer.current)
        }
    }, [query])

    const pick = (r: ScheduleSearchResult) => {
        onSourceChange({id: r.id, kind: r.kind, title: r.title})
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
            <input
                className="schedule-settings__search"
                placeholder={t('schedule.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoCapitalize="none"
                spellCheck={false}
            />
            <div className="schedule-settings__results">
                {results.map((r) => (
                    <button key={`${r.kind}-${r.id}`} type="button" onClick={() => pick(r)}
                            className="schedule-settings__result">
                        <span className="schedule-settings__result-title">{r.title}</span>
                        {r.subtitle && <span className="schedule-settings__result-subtitle">{r.subtitle}</span>}
                    </button>
                ))}
            </div>
        </Sheet>
    )
};
