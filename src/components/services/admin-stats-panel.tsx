'use client'
// Панель статистики для админов

import {Icon} from '@/components/common/icons'
import {useI18n, type I18nKey} from '@/i18n'
import type {AdminStats, DailyStat} from '@/shared/types'

const CHART_HEIGHT = 40

const ActivityChart = ({daily}: { daily: DailyStat[] }) => {
    const {t} = useI18n()
    const days = [...daily].reverse()
    const max = Math.max(1, ...days.map((d) => d.requests))
    const n = days.length

    if (n === 0) {
        return <div className="admin-stats__chart-empty">{t('admin.activityEmpty')}</div>
    }

    const slot = 100 / n
    const barWidth = slot * 0.62

    return (
        <svg
            viewBox={`0 0 100 ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="admin-stats__chart"
            role="img"
            aria-label={t('admin.activity', {n})}
        >
            {days.map((d, i) => {
                const h = (d.requests / max) * (CHART_HEIGHT - 2)
                return (
                    <rect
                        key={d.date}
                        x={i * slot + (slot - barWidth) / 2}
                        y={CHART_HEIGHT - h}
                        width={barWidth}
                        height={Math.max(h, 1)}
                        rx={1.5}
                        className="admin-stats__bar"
                    >
                        <title>{`${d.date}: ${d.requests}`}</title>
                    </rect>
                )
            })}
        </svg>
    )
};

const BreakdownRow = ({label, values, labels}: { label: string; values: Record<string, number>; labels: Record<string, string> }) => {
    const entries = Object.entries(values).sort(([, a], [, b]) => b - a)
    if (entries.length === 0) return null

    return (
        <div className="admin-stats__usage-row">
            <span className="admin-stats__usage-label">{label}</span>
            <span className="admin-stats__usage-values">
                {entries.map(([key, count]) => `${labels[key] ?? key} — ${count}`).join(' · ')}
            </span>
        </div>
    )
};

const VALUE_LABELS: Record<keyof AdminStats['settingsUsage'], Record<string, string>> = {
    theme: {dark: 'тёмная', light: 'светлая', system: 'системная'},
    passButtonMode: {fab: 'плавающая кнопка', navbar: 'в навигации'},
    tileResize: {'1': 'малая', '2': 'широкая', '4': 'крупная'},
    notifications: {on: 'включены', off: 'выключены'},
    feedEnabled: {on: 'включена', off: 'выключена'},
    language: {ru: 'русский', en: 'английский', fr: 'французский', es: 'испанский', ar: 'арабский', zh: 'китайский'},
};

export const AdminStatsPanel = ({stats}: { stats: AdminStats }) => {
    const {t} = useI18n()
    const todayStat = stats.daily[0]
    const usageRows: Array<{ labelKey: I18nKey; field: keyof AdminStats['settingsUsage'] }> = [
        {labelKey: 'admin.settingsTheme', field: 'theme'},
        {labelKey: 'admin.settingsPassButton', field: 'passButtonMode'},
        {labelKey: 'admin.settingsTileResize', field: 'tileResize'},
        {labelKey: 'admin.settingsNotifications', field: 'notifications'},
        {labelKey: 'admin.settingsFeed', field: 'feedEnabled'},
        {labelKey: 'admin.settingsLanguage', field: 'language'},
    ]

    return (
        <div className="admin-stats">
            <div className="admin-stats__head">
                <Icon name="chartBar" className="admin-stats__icon"/>
                <span className="section-title">{t('admin.title')}</span>
            </div>

            <div className="admin-stats__kpis">
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{stats.uniqueToday}</div>
                    <div className="admin-stats__kpi-label">{t('admin.uniqueToday')}</div>
                </div>
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{todayStat?.requests ?? 0}</div>
                    <div className="admin-stats__kpi-label">{t('admin.requestsToday')}</div>
                </div>
            </div>

            <div className="admin-stats__section-title">{t('admin.activity', {n: stats.daily.length})}</div>
            <ActivityChart daily={stats.daily}/>

            <div className="admin-stats__section-title">{t('admin.authUsers')}</div>
            <div className="admin-stats__kpis">
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{stats.authUsers.student}</div>
                    <div className="admin-stats__kpi-label">{t('admin.students')}</div>
                </div>
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{stats.authUsers.instructor}</div>
                    <div className="admin-stats__kpi-label">{t('admin.instructors')}</div>
                </div>
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{stats.authUsers.total}</div>
                    <div className="admin-stats__kpi-label">{t('admin.totalUsers')}</div>
                </div>
            </div>

            <div className="admin-stats__section-title">{t('admin.devices')}</div>
            <div className="admin-stats__kpis">
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{stats.devices.desktop}</div>
                    <div className="admin-stats__kpi-label">{t('admin.deviceDesktop')}</div>
                </div>
                <div className="admin-stats__kpi">
                    <div className="admin-stats__kpi-value">{stats.devices.mobile}</div>
                    <div className="admin-stats__kpi-label">{t('admin.deviceMobile')}</div>
                </div>
            </div>

            <div className="admin-stats__appearance">
                <span className="admin-stats__appearance-value">{stats.appearanceChangers}</span>
                <span className="admin-stats__appearance-hint">{t('admin.appearanceChangersHint')}</span>
            </div>

            <div className="admin-stats__section-title">{t('admin.settingsUsage')}</div>
            <div className="admin-stats__usage">
                {usageRows.map(({labelKey, field}) => (
                    <BreakdownRow
                        key={field}
                        label={t(labelKey)}
                        values={stats.settingsUsage[field]}
                        labels={VALUE_LABELS[field]}
                    />
                ))}
            </div>

            <div className="admin-stats__section-title">{t('admin.byDay')}</div>
            <div className="admin-stats__days">
                {stats.daily.map((d) => (
                    <div key={d.date} className="admin-stats__day">
                        <span className="admin-stats__day-date">{d.date}</span>
                        <span className="admin-stats__day-nums">
                            {t('admin.dayRequests', {n: d.requests})} · {t('admin.dayUnique', {n: d.uniqueIps})}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
};
