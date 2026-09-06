'use client'
// Экран расписания
//
// При загрузке загружает расписание из IndexedDB, затем в фоне запрашивает обновление


import {useEffect, useMemo, useRef, useState} from 'react'
import {Icon, type IconName} from '@/components/common/icons'
import {PageHeader} from '@/components/common/page-header.tsx'
import {DayCarousel} from '@/components/schedule/day-carousel.tsx'
import {DayBlock} from '@/components/schedule/day-block.tsx'
import {WeekStrip} from '@/components/schedule/week-strip.tsx'
import {CalendarSheet} from '@/components/schedule/calendar-sheet.tsx'
import {ScheduleSettingsSheet} from '@/components/schedule/schedule-settings-sheet.tsx'
import {useI18n} from '@/i18n'
import {getSchedule} from '@/lib/api-client'
import {getScheduleSource, setScheduleSource, type ScheduleSource} from '@/lib/schedule-source'
import {readRaw, writeRaw} from '@/lib/token-store'
import {useForceRefreshIfEmpty, useOfflineData} from '@/lib/swr'
import {useSwipe} from '@/lib/use-swipe'
import {useNow} from '@/lib/use-now'
import {
    addDays,
    fmtLong,
    fmtShort,
    groupByDate,
    mondayOf,
    parseKey,
    sameDay,
    smartInitialDate,
    toKey,
    weekParity,
} from '@/lib/schedule-utils'
import type {ScheduleData} from '@/shared/types'

type Mode = 'dates' | 'weeks'

const MODE_KEY = 'susu_schedule_mode'

const NavArrow = ({icon, label, onClick}: {icon: IconName; label: string; onClick: () => void}) => (
    <button type="button" onClick={onClick} aria-label={label} className="schedule__nav-arrow">
        <Icon name={icon} className="schedule__nav-arrow-icon"/>
    </button>
);

export default () => {
    const {t} = useI18n()
    const now = useNow()
    const [source, setSource] = useState<ScheduleSource | null>(() => getScheduleSource())
    const [mode, setModeState] = useState<Mode>(() => (readRaw(MODE_KEY) === 'weeks' ? 'weeks' : 'dates'))
    const setMode = (m: Mode) => {
        writeRaw(MODE_KEY, m)
        setModeState(m)
    };
    const [pivot, setPivot] = useState<Date>(() => new Date())
    const [weekMonday, setWeekMonday] = useState<Date>(() => mondayOf(new Date()))
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [calendarOpen, setCalendarOpen] = useState(false)
    const [slide, setSlide] = useState<{ dir: 'left' | 'right'; step: number } | null>(null)

    const scheduleCacheKey = source ? `${source.kind}:${source.id}` : 'none'

    const {data, refreshing, refresh} = useOfflineData<ScheduleData>({
        store: 'schedule',
        cacheKey: scheduleCacheKey,
        enabled: !!source,
        fetcher: (force) => getSchedule(source!.id, source!.kind, {force}),
    })

    useForceRefreshIfEmpty(scheduleCacheKey, data != null && data.events.length === 0, refreshing, refresh)

    const byDate = useMemo(() => groupByDate(data?.events ?? []), [data])

    // Подбираем день по умолчанию (сегодня / ближайший день с парами) один раз на источник, как только данные загрузились
    const autoPickedForRef = useRef<string | null>(null)
    useEffect(() => {
        if (!data) return
        if (autoPickedForRef.current === scheduleCacheKey) return
        autoPickedForRef.current = scheduleCacheKey
        const smart = smartInitialDate(byDate, now)
        setPivot(smart)
        setWeekMonday(mondayOf(smart))
    }, [data, scheduleCacheKey, byDate, now])

    const weeks = useMemo(() => {
        const set = new Set<string>()
        for (const key of byDate.keys()) set.add(toKey(mondayOf(new Date(`${key}T00:00:00`))))
        if (set.size === 0) set.add(toKey(mondayOf(now)))
        return [...set].sort().map((k) => new Date(`${k}T00:00:00`))
    }, [byDate, now])

    const onSourceChange = (s: ScheduleSource) => {
        setScheduleSource(s)
        setSource(s)
    };

    const daysBetween = (a: Date, b: Date): number =>
        Math.round((parseKey(toKey(b)).getTime() - parseKey(toKey(a)).getTime()) / 86400000);

    const findNextDateWithPairs = (from: Date): Date | null => {
        const fromKey = toKey(from)
        let best: string | null = null
        for (const k of byDate.keys()) {
            if (k > fromKey && (best === null || k < best)) best = k
        }
        return best ? parseKey(best) : null
    };

    const findPrevDateWithPairs = (from: Date): Date | null => {
        const fromKey = toKey(from)
        let best: string | null = null
        for (const k of byDate.keys()) {
            if (k < fromKey && (best === null || k > best)) best = k
        }
        return best ? parseKey(best) : null
    };

    const {handlers, pullDistance} = useSwipe({
        onSwipeLeft: () => {
            if (mode !== 'dates') return shiftWeek(1)
            const next = findNextDateWithPairs(pivot)
            if (next) setSlide((s) => s ?? {dir: 'left', step: daysBetween(pivot, next)})
        },
        onSwipeRight: () => {
            if (mode !== 'dates') return shiftWeek(-1)
            const prev = findPrevDateWithPairs(pivot)
            if (prev) setSlide((s) => s ?? {dir: 'right', step: daysBetween(prev, pivot)})
        },
        onPullRefresh: () => void refresh(true),
    })

    const onSlideSettled = () => {
        setPivot((d) => (slide ? addDays(d, slide.dir === 'left' ? slide.step : -slide.step) : d))
        setSlide(null)
    };

    const goNextWeekInDates = () => setSlide((s) => s ?? {dir: 'left', step: 7});
    const goPrevWeekInDates = () => setSlide((s) => s ?? {dir: 'right', step: 7});
    const onStripWeekShift = (dir: 1 | -1) => setPivot((d) => addDays(d, dir * 7));

    const shiftWeek = (dir: number) => {
        setWeekMonday((m) => addDays(m, dir * 7))
    };

    const selWeekMonday = weeks.find((w) => sameDay(w, weekMonday)) ?? weeks[0]

    const subtitle = source
        ? mode === 'dates'
            ? `${source.title} · ${fmtLong(pivot)}`
            : selWeekMonday
                ? `${source.title} · ${fmtShort(selWeekMonday)} – ${fmtShort(addDays(selWeekMonday, 6))}`
                : source.title
        : '—'

    const renderDateStrip = () => (
        <div className="schedule__strip">
            <NavArrow icon="chevronLeft" label={t('schedule.prevWeekInDates')} onClick={goPrevWeekInDates}/>
            <WeekStrip
                pivot={pivot}
                now={now}
                getPairs={(d) => byDate.get(toKey(d)) ?? []}
                onPick={setPivot}
                onWeekShift={onStripWeekShift}
            />
            <NavArrow icon="chevronRight" label={t('schedule.nextWeekInDates')} onClick={goNextWeekInDates}/>
        </div>
    );

    const renderWeekStrip = () => {
        const selMonday = selWeekMonday ?? weeks[0]!

        return (
            <div className="schedule__weeks">
                <NavArrow icon="chevronLeft" label={t('schedule.prevWeek')} onClick={() => shiftWeek(-1)}/>
                <div className="schedule__weeks-scroll">
                    {weeks.map((w) => {
                        const active = sameDay(w, selMonday)
                        const isCurrent = sameDay(w, mondayOf(now))
                        return (
                            <button
                                key={toKey(w)}
                                type="button"
                                onClick={() => setWeekMonday(w)}
                                className={`schedule__week-card${active ? ' schedule__week-card--active' : ''}`}
                            >
                                <span className={`schedule__week-title${active ? ' schedule__week-title--active' : ''}`}>
                                    {weekParity(w)} неделя
                                    {isCurrent && (
                                        <i className={`schedule__week-current-dot${active ? ' schedule__week-current-dot--active' : ''}`}/>
                                    )}
                                </span>
                                <span className={`schedule__week-range${active ? ' schedule__week-range--active' : ''}`}>
                                    {fmtShort(w)} – {fmtShort(addDays(w, 6))}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <NavArrow icon="chevronRight" label={t('schedule.nextWeek')} onClick={() => shiftWeek(1)}/>
            </div>
        )
    };

    const renderWeekDays = () => {
        const selMonday = selWeekMonday ?? weeks[0]!
        const days = Array.from({length: 6}, (_, i) => addDays(selMonday, i)).filter((d) => (byDate.get(toKey(d)) ?? []).length > 0)

        return days.length > 0 ? (
            days.map((d) => {
                const key = toKey(d)
                const isExpanded = key in expanded ? expanded[key]! : sameDay(d, now)
                return (
                    <DayBlock
                        key={key}
                        date={d}
                        pairs={byDate.get(key) ?? []}
                        expanded={isExpanded}
                        onToggle={() => setExpanded((e) => ({...e, [key]: !isExpanded}))}
                        now={now}
                    />
                )
            })
        ) : (
            <div className="empty-state">{t('schedule.noClasses')}</div>
        )
    };

    return (
        <div className="screen">
            <div className="screen__header">
                <PageHeader
                    title={t('schedule.title')}
                    subtitle={subtitle}
                    actions={[
                        {icon: 'calendarEvent', label: t('schedule.pickDate'), onClick: () => setCalendarOpen(true)},
                        {icon: 'settings', label: t('schedule.settings'), onClick: () => setSettingsOpen(true)},
                    ]}
                />
                <div className="schedule__body">{mode === 'dates' ? renderDateStrip() : renderWeekStrip()}</div>
            </div>

            <div className="schedule__content" {...handlers}>
                {(pullDistance > 0 || refreshing) && (
                    <div className="pull-refresh" style={{height: Math.max(pullDistance, refreshing ? 28 : 0)}}>
                        {refreshing ? <span className="spinner"/> : t('schedule.pullToRefresh')}
                    </div>
                )}

                {mode === 'dates' ? (
                    <DayCarousel
                        pivot={pivot}
                        getPairs={(day) => byDate.get(toKey(day)) ?? []}
                        now={now}
                        emptyText={t('schedule.noClasses')}
                        dir={slide?.dir ?? null}
                        step={slide?.step ?? 1}
                        onSettled={onSlideSettled}
                    />
                ) : (
                    <div className="schedule__body">{renderWeekDays()}</div>
                )}
            </div>

            <ScheduleSettingsSheet
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                mode={mode}
                onModeChange={setMode}
                onSourceChange={onSourceChange}
            />
            <CalendarSheet
                open={calendarOpen}
                onClose={() => setCalendarOpen(false)}
                selected={pivot}
                getPairs={(d) => byDate.get(toKey(d)) ?? []}
                now={now}
                onPick={(d) => {
                    setPivot(d)
                    setMode('dates')
                }}
            />
        </div>
    )
}
