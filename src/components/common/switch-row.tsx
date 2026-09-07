'use client'
// Строка-переключатель для настроек

import {Icon, type IconName} from './icons'

export const SwitchRow = ({
    icon,
    label,
    hint,
    on,
    onToggle,
}: {
    icon: IconName
    label: string
    hint: string
    on: boolean
    onToggle: () => void
}) => (
    <div className="settings-switch">
        <span className="settings-switch__icon">
            <Icon name={icon} className="settings-switch__icon-svg"/>
        </span>
        <span className="settings-switch__body">
            <span className="settings-switch__label">{label}</span>
            <span className="settings-switch__hint">{hint}</span>
        </span>
        <button
            type="button"
            onClick={onToggle}
            aria-pressed={on}
            className={`settings-switch__toggle${on ? ' settings-switch__toggle--on' : ''}`}
        >
            <span className="settings-switch__toggle-knob"/>
        </button>
    </div>
)
