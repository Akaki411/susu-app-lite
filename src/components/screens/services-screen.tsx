'use client'
// Экран Сервисы

import {useEffect, useRef, useState} from 'react'
import {PageHeader} from '@/components/common/page-header.tsx'
import {Icon} from '@/components/common/icons'
import {ServicesSettingsSheet} from '@/components/services/services-settings-sheet.tsx'
import {TileSettingsSheet} from '@/components/services/tile-settings-sheet.tsx'
import {useI18n} from '@/i18n'
import {getAdminStats} from '@/lib/api-client'
import {navigate} from '@/lib/router'
import {useSettings} from '@/lib/settings'
import {clearSession, getProfile} from '@/lib/token-store'
import {SERVICE_META, services} from '@/services/registry'
import type {AdminStats} from '@/shared/types'

const initialsOf = (first: string, last: string) => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

// 5 нажатий на «Группу» подряд копирует ID студента в буфер, сделано для случаев, когда нужно сообщить его админу
const TAP_TARGET = 5
const TAP_WINDOW_MS = 400
const COPIED_HINT_MS = 1000

type SheetView = 'none' | 'settings' | 'tiles'

export default () => {
    const {t} = useI18n()
    const {settings} = useSettings()
    const [sheet, setSheet] = useState<SheetView>('none')
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
    const [copied, setCopied] = useState(false)
    const tapCount = useRef(0)
    const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const profile = getProfile()
    const visibleTiles = SERVICE_META.filter((s) => (settings.tiles[s.id]?.enabled ?? true)).length

    useEffect(() => {
        if (!profile) return
        let cancelled = false
        getAdminStats()
            .then((s) => {
                if (!cancelled) setAdminStats(s)
            })
            .catch(() => {
                if (!cancelled) setAdminStats(null)
            })
        return () => {
            cancelled = true
        }
    }, [profile?.userId])

    const signOut = () => {
        clearSession()
        navigate('/login', {replace: true})
    }

    const onGroupTap = () => {
        if (!profile) return
        if (tapTimer.current) clearTimeout(tapTimer.current)
        tapCount.current += 1
        if (tapCount.current >= TAP_TARGET) {
            tapCount.current = 0
            void navigator.clipboard?.writeText(profile.userId).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), COPIED_HINT_MS)
            })
            return
        }
        tapTimer.current = setTimeout(() => {
            tapCount.current = 0
        }, TAP_WINDOW_MS)
    }

    const todayStat = adminStats?.daily[0]

    return (
        <div className="screen">
            <PageHeader
                title={t('services.title')}
                subtitle={t('services.subtitle')}
                actions={[{icon: 'settings', label: t('settings.title'), onClick: () => setSheet('settings')}]}
            />

            <div className="services__body">
                {profile && (
                    <>
                        <div className="services__profile">
                            <div className="services__avatar">{initialsOf(profile.firstName, profile.lastName)}</div>
                            <div className="services__username">@{profile.userName}</div>
                            <div className="services__name">
                                {profile.lastName} {profile.firstName} {profile.middleName ?? ''}
                            </div>
                            {profile.specialityName && <div className="services__speciality">{profile.specialityName}</div>}

                        </div>

                        <div className="services__meta">
                            <button type="button" className="services__meta-tap" onClick={onGroupTap}>
                                <div className="services__meta-label">{t('services.group')}</div>
                                <div className="services__meta-value">{profile.groupName}</div>
                                {copied && <div className="services__meta-copied">{t('services.idCopied')}</div>}
                            </button>
                            {profile.studyYears && (
                                <div>
                                    <div className="services__meta-label">{t('services.form')}</div>
                                    <div
                                        className="services__meta-value">{profile.educationForm ?? t('services.formFull')}</div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="section-title section-title--spaced">{t('services.microservices')}</div>
                {services.length === 0 ? (
                    <div className="empty-state empty-state--compact">{t('services.empty')}</div>
                ) : visibleTiles === 0 ? (
                    <div className="empty-state empty-state--compact">{t('settings.tilesAllHidden')}</div>
                ) : (
                    <div className="services__grid">{services}</div>
                )}

                {adminStats && (
                    <div className="admin-stats">
                        <div className="admin-stats__head">
                            <Icon name="chartBar" className="admin-stats__icon"/>
                            <span className="section-title">{t('admin.title')}</span>
                        </div>
                        <div className="admin-stats__kpis">
                            <div className="admin-stats__kpi">
                                <div className="admin-stats__kpi-value">{adminStats.uniqueToday}</div>
                                <div className="admin-stats__kpi-label">{t('admin.uniqueToday')}</div>
                            </div>
                            <div className="admin-stats__kpi">
                                <div className="admin-stats__kpi-value">{todayStat?.requests ?? 0}</div>
                                <div className="admin-stats__kpi-label">{t('admin.requestsToday')}</div>
                            </div>
                        </div>
                        <div className="admin-stats__days">
                            {adminStats.daily.map((d) => (
                                <div key={d.date} className="admin-stats__day">
                                    <span className="admin-stats__day-date">{d.date}</span>
                                    <span className="admin-stats__day-nums">
                                        {t('admin.dayRequests', {n: d.requests})} · {t('admin.dayUnique', {n: d.uniqueIps})}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button type="button" onClick={signOut} className="services__signout">
                    <Icon name="logout" className="services__signout-icon"/>
                    {t('services.signOut')}
                </button>
            </div>

            <ServicesSettingsSheet
                open={sheet === 'settings'}
                onClose={() => setSheet('none')}
                onOpenTiles={() => setSheet('tiles')}
            />
            <TileSettingsSheet open={sheet === 'tiles'} onClose={() => setSheet('none')}/>
        </div>
    )
}
