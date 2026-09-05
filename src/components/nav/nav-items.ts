'use client'
// Определение пунктов навигации

import type {IconName} from '@/components/common/icons'
import type {I18nKey} from '@/i18n'
import type {Settings} from '@/lib/settings'

export interface NavItem {
    id: string
    labelKey: I18nKey
    icon: IconName
    kind: 'route' | 'action'
    href?: string
    action?: 'pass'
}

export const buildNavItems = (settings: Settings): NavItem[] => {
    const items: NavItem[] = []
    if (settings.feedEnabled) {
        items.push({id: 'feed', labelKey: 'nav.feed', icon: 'news', kind: 'route', href: '/feed'})
    }
    items.push({id: 'schedule', labelKey: 'nav.schedule', icon: 'clock', kind: 'route', href: '/schedule'})
    if (settings.passButtonMode === 'navbar') {
        items.push({id: 'pass', labelKey: 'nav.pass', icon: 'thinQr', kind: 'action', action: 'pass'})
    }
    items.push({id: 'rating', labelKey: 'nav.rating', icon: 'award', kind: 'route', href: '/rating'})
    items.push({id: 'services', labelKey: 'nav.services', icon: 'layoutGrid', kind: 'route', href: '/services'})
    return items
};

export const OPEN_PASS_EVENT = 'susu:open-pass'

export const openPass = (): void => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(OPEN_PASS_EVENT))
};
