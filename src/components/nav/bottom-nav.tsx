'use client'
// Нижняя навигация (мобильная). Полупрозрачная с размытием, как в дизайне.

import { Icon } from '@/components/common/icons'
import { useI18n } from '@/i18n'
import { navigate, useCurrentPath } from '@/lib/router'
import { useSettings } from '@/lib/settings'
import { buildNavItems, openPass, type NavItem } from './nav-items'

export default () => {
  const { settings } = useSettings()
  const { t } = useI18n()
  const pathname = useCurrentPath()
  const items = buildNavItems(settings)

  const onClick = (item: NavItem) => {
    if (item.kind === 'action') openPass()
    else if (item.href) navigate(item.href)
  }

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const active = item.kind === 'route' && item.href != null && pathname.startsWith(item.href)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onClick(item)}
            className="bottom-nav__item"
            aria-current={active ? 'page' : undefined}
          >
            <Icon name={item.icon} className={`bottom-nav__icon${active ? ' bottom-nav__icon--active' : ''}`} />
            <span className={`bottom-nav__label${active ? ' bottom-nav__label--active' : ''}`}>
              {t(item.labelKey)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
