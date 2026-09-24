'use client'
// Всплывающее уведомление об изменении собственного расписания

import {Sheet} from '@/components/common/sheet.tsx'
import {PairCard} from './pair-card.tsx'
import {useI18n} from '@/i18n'
import {DOW_SHORT, fmtLong, parseKey} from '@/lib/schedule-utils'
import type {DayDiff} from '@/lib/schedule-diff'

const DayColumn = ({label, events, emptyText}: { label: string; events: DayDiff['before']; emptyText: string }) => (
    <div className="schedule-update__col">
        <div className="schedule-update__col-label">{label}</div>
        {events.length > 0 ? (
            <div className="pair-list">
                {events.map((e, i) => (
                    <PairCard key={i} event={e} live={false}/>
                ))}
            </div>
        ) : (
            <div className="schedule-update__col-empty">{emptyText}</div>
        )}
    </div>
);

export const ScheduleUpdateSheet = ({diffs, onClose}: { diffs: DayDiff[] | null; onClose: () => void }) => {
    const {t} = useI18n()
    const open = !!diffs && diffs.length > 0

    return (
        <Sheet open={open} onClose={onClose} title={t('schedule.updateTitle')}>
            {open && (
                <>
                    <p className="schedule-update__intro">{t('schedule.updateIntro')}</p>
                    <div className="schedule-update__list">
                        {diffs!.map((d) => {
                            const date = parseKey(d.date)
                            const dowIdx = (date.getDay() + 6) % 7
                            return (
                                <div key={d.date} className="schedule-update__day">
                                    <div className="schedule-update__day-title">
                                        {DOW_SHORT[dowIdx]}, {fmtLong(date)}
                                    </div>
                                    <DayColumn label={t('schedule.updateWas')} events={d.before} emptyText={t('schedule.noClasses')}/>
                                    <DayColumn label={t('schedule.updateNow')} events={d.after} emptyText={t('schedule.noClasses')}/>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </Sheet>
    )
}
