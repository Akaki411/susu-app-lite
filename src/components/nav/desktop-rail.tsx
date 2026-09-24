'use client'
// Боковая навигация (десктоп). Акцентный фон с логотипом университета сверху.

import { useEffect, useMemo } from 'react'
import { Icon } from '@/components/common/icons'
import { useI18n } from '@/i18n'
import { navigate, prefetch, useCurrentPath } from '@/lib/router'
import { useSettings } from '@/lib/settings'
import { buildNavItems, openPass, type NavItem } from './nav-items'

export default () => {
    const { settings } = useSettings()
    const { t } = useI18n()
    const pathname = useCurrentPath()
    const items = useMemo(() => buildNavItems(settings), [settings.feedEnabled, settings.passButtonMode])

    useEffect(() => {
        for (const item of items) {
            if (item.kind === 'route' && item.href) {
                prefetch(item.href)
            }
        }
    }, [items])

    const onClick = (item: NavItem) => {
        if (item.kind === 'action') openPass()
        else if (item.href) {
            if (pathname === item.href) return
            navigate(item.href)
        }
    }

    return (
        <nav className="rail">
            <img src="/logo.webp" alt="ЮУрГУ" className="rail__logo" />
            {items.map((item) => {
                const active = item.kind === 'route' && item.href != null && pathname.startsWith(item.href)
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onClick(item)}
                        onMouseEnter={() => { if (item.href && pathname !== item.href) prefetch(item.href) }}
                        className={`rail__item${active ? ' rail__item--active' : ''}`}
                        aria-current={active ? 'page' : undefined}
                    >
                        <Icon name={item.icon} className={`rail__icon${active ? ' rail__icon--active' : ''}`}/>
                        <span>{t(item.labelKey)}</span>
                    </button>
                )
            })}
        </nav>
    )
}
