'use client'
// Экран Сервисы

import {useEffect, useRef, useState} from 'react'
import {PageHeader} from '@/components/common/page-header.tsx'
import {Icon} from '@/components/common/icons'
import {AdminStatsPanel} from '@/components/services/admin-stats-panel.tsx'
import {ServicesSettingsSheet} from '@/components/services/services-settings-sheet.tsx'
import {TileSettingsSheet} from '@/components/services/tile-settings-sheet.tsx'
import {useI18n} from '@/i18n'
import {getAdminStats} from '@/lib/api-client'
import {navigate} from '@/lib/router'
import {useSettings} from '@/lib/settings'
import {clearSession, getProfile} from '@/lib/token-store'
import {SERVICE_META, services} from '@/services/registry'
import type {AdminStatsResult} from '@/shared/types'

const initialsOf = (first: string, last: string) => `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()

// 5 нажатий на юзернейм подряд копирует ID студента в буфер, сделано для случаев, когда нужно сообщить его админу
const TAP_TARGET = 5
const TAP_WINDOW_MS = 400
const COPIED_HINT_MS = 1000

type SheetView = 'none' | 'settings' | 'tiles'

const MetaCopyRow = ({
    label,
    value,
    copied,
    copiedLabel,
    onCopy
}: {
    label: string
    value: string
    copied: boolean
    copiedLabel: string
    onCopy: () => void
}) => (
    <button type="button" className="services__meta-tap" onClick={onCopy}>
        <div className="services__meta-label">{label}</div>
        <div className="services__meta-value">{value}</div>
        {copied && <div className="services__meta-copied">{copiedLabel}</div>}
    </button>
);

export default () => {
    const {t} = useI18n()
    const {settings} = useSettings()
    const [sheet, setSheet] = useState<SheetView>('none')
    const [adminStats, setAdminStats] = useState<AdminStatsResult | null>(null)
    const [copied, setCopied] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const tapCount = useRef(0)
    const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const copiedFieldTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const profile = getProfile()
    const visibleTiles = SERVICE_META.filter((s) => (settings.tiles[s.id]?.enabled ?? true)).length

    const copyableMeta: Array<{ field: string; label: string; value: string | undefined }> = [
        {field: 'faculty', label: t('services.faculty'), value: profile?.faculty},
        {field: 'speciality', label: t('services.speciality'), value: profile?.specialityName},
        {field: 'email', label: t('services.email'), value: profile?.email},
        {field: 'phone', label: t('services.phone'), value: profile?.phone},
        {field: 'address', label: t('services.address'), value: profile?.address},
        {field: 'recordBook', label: t('services.recordBook'), value: profile?.recordBookNumber},
        {field: 'dormAccount', label: t('services.dormAccount'), value: profile?.dormAccountNumber},
    ]
    const visibleCopyableMeta = copyableMeta.filter(
        (m): m is { field: string; label: string; value: string } => !!m.value,
    )

    const copyValue = (field: string, value: string) => {
        void navigator.clipboard?.writeText(value).then(() => {
            if (copiedFieldTimer.current) clearTimeout(copiedFieldTimer.current)
            setCopiedField(field)
            copiedFieldTimer.current = setTimeout(() => setCopiedField(null), COPIED_HINT_MS)
        })
    }

    useEffect(() => {
        if (!profile) return
        let cancelled = false
        getAdminStats(14)
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

    const onUsernameTap = () => {
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

    return (
        <div className="screen">
            <div className="screen__header">
                <PageHeader
                    title={t('services.title')}
                    subtitle={t('services.subtitle')}
                    actions={[{icon: 'settings', label: t('settings.title'), onClick: () => setSheet('settings')}]}
                />
            </div>

            <div className="services__viewport">
                <div className="services__body">
                    {profile && (
                        <>
                            <div className="services__profile">
                                <div className="services__avatar">{initialsOf(profile.firstName, profile.lastName)}</div>
                                <button type="button" className="services__username" onClick={onUsernameTap}>
                                    @{profile.userName}
                                    {copied && <span className="services__username-copied">{t('services.idCopied')}</span>}
                                </button>
                                <div className="services__name">
                                    {profile.lastName} {profile.firstName} {profile.middleName ?? ''}
                                </div>
                            </div>

                            <div className="services__meta">
                                <div className="services__meta-item">
                                    <div className="services__meta-label">{t('services.group')}</div>
                                    <div className="services__meta-value">{profile.groupName}</div>
                                </div>
                                {profile.studyYears && (
                                    <div className="services__meta-item">
                                        <div className="services__meta-label">{t('services.form')}</div>
                                        <div
                                            className="services__meta-value">{profile.educationForm ?? t('services.formFull')}</div>
                                    </div>
                                )}
                                {visibleCopyableMeta.map((m) => (
                                    <MetaCopyRow
                                        key={m.field}
                                        label={m.label}
                                        value={m.value}
                                        copied={copiedField === m.field}
                                        copiedLabel={t('services.valueCopied')}
                                        onCopy={() => copyValue(m.field, m.value)}
                                    />
                                ))}
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

                    {adminStats?.isAdmin && <AdminStatsPanel stats={adminStats}/>}

                    <button type="button" onClick={signOut} className="services__signout">
                        <Icon name="logout" className="services__signout-icon"/>
                        {t('services.signOut')}
                    </button>
                </div>
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
