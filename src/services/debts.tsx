'use client'
// Протоколы и графики ликвидации задолженностей

import {useEffect, useState} from 'react'
import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'
import {getDebts} from '@/lib/api-client'
import {tileConfig, useSettings} from '@/lib/settings'
import {ServiceTileBase} from './service-tile-base.tsx'
import type {DebtSchedule} from '@/shared/types'

const fmtDate = (iso: string): string =>
    iso ? new Date(iso).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'}) : '—'

export default () => {
    const {t} = useI18n()
    const {settings} = useSettings()
    const [open, setOpen] = useState(false)
    const [debts, setDebts] = useState<DebtSchedule[] | null>(null)
    const [failed, setFailed] = useState(false)
    const cfg = tileConfig(settings, 'debts', 2)

    useEffect(() => {
        if (!open) return
        setDebts(null)
        setFailed(false)
        let cancelled = false
        getDebts()
            .then((d) => {
                if (!cancelled) setDebts(d)
            })
            .catch(() => {
                if (!cancelled) setFailed(true)
            })
        return () => {
            cancelled = true
        }
    }, [open])

    if (!cfg.enabled) return null

    return (
        <>
            <ServiceTileBase
                size={cfg.size}
                tone="c"
                icon="/icons/contract.webp"
                label={t('services.debts')}
                onClick={() => setOpen(true)}
            />
            <Sheet open={open} onClose={() => setOpen(false)} title={t('debts.title')}>
                {failed ? (
                    <div className="empty-state">{t('debts.error')}</div>
                ) : !debts ? (
                    <div className="empty-state empty-state--compact">{t('common.loading')}</div>
                ) : debts.length === 0 ? (
                    <div className="empty-state empty-state--compact">{t('debts.empty')}</div>
                ) : (
                    <div className="debts">
                        {debts.map((s) => (
                            <div key={s.id} className="debts__card">
                                <div className="debts__card-head">
                                    <span className="debts__year">{t('debts.year', {n: s.yearDebt})}</span>
                                    <span
                                        className="debts__deadline">{t('debts.deadline', {date: fmtDate(s.finalDate)})}</span>
                                </div>
                                <div className="debts__items">
                                    {s.items.map((it, i) => (
                                        <div key={i} className="debts__item">
                                            <div className="debts__item-subject">{it.subject}</div>
                                            <div className="debts__item-meta">
                                                {it.controlType} · {t('debts.term', {n: it.term})} ·{' '}
                                                {it.isPrimary ? t('debts.primary') : t('debts.repeat')}
                                                {it.isPractice ? ` · ${t('debts.practice')}` : ''}
                                            </div>
                                            <div
                                                className="debts__item-reexam">{t('debts.reexam', {date: fmtDate(it.reexamDate)})}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Sheet>
        </>
    )
}
