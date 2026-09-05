'use client'
// Шапка экрана (заголовок + подзаголовок + кнопки-действия справа)

import type { ReactNode } from 'react'
import { Icon, type IconName } from './icons'

export interface HeaderAction {
  icon: IconName
  label: string
  onClick: () => void
}

export const PageHeader = ({
    title,
    subtitle,
    actions,
}: {
    title: string
    subtitle?: ReactNode
    actions?: HeaderAction[]
}) => (
    <div className="page-header">
        <div className="page-header__info">
            <h2 className="page-header__title">{title}</h2>
            {subtitle != null && <p className="page-header__subtitle">{subtitle}</p>}
        </div>
        {actions && actions.length > 0 && (
            <div className="page-header__actions">
                {actions.map((a) => (
                    <button
                        key={a.label}
                        type="button"
                        onClick={a.onClick}
                        aria-label={a.label}
                        className="page-header__action"
                    >
                        <Icon name={a.icon} className="page-header__action-icon"/>
                    </button>
                ))}
            </div>
        )}
    </div>
);
