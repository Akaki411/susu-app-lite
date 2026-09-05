'use client'
// Настройка плиток сервисов

import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'
import {tileConfig, updateTile, useSettings, type TileConfig} from '@/lib/settings'
import {SERVICE_META} from '@/services/registry'
import type {TileSize} from '@/services/types'

const SIZES: TileSize[] = [1, 2, 4]
const DEFAULT_SIZE: TileSize = 2

export const TileSettingsSheet = ({open, onClose}: { open: boolean; onClose: () => void }) => {
    const {t} = useI18n()
    const {settings} = useSettings()

    const setTile = (id: string, patch: Partial<TileConfig>) => updateTile(id, DEFAULT_SIZE, patch)

    return (
        <Sheet open={open} onClose={onClose} title={t('settings.tiles')}>
            <div className="tile-settings__hint">{t('settings.tilesHint')}</div>
            {SERVICE_META.map((s) => {
                const cfg = tileConfig(settings, s.id, DEFAULT_SIZE)
                return (
                    <div key={s.id} className={`tile-settings__row${cfg.enabled ? '' : ' tile-settings__row--off'}`}>
                        <span className="tile-settings__icon">
                          <img src={s.icon} alt=""/>
                        </span>
                        <span className="tile-settings__name">{t(s.labelKey)}</span>
                        <div className="tile-settings__sizes">
                            {SIZES.map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setTile(s.id, {size: n})}
                                    className={`tile-settings__size${cfg.size === n ? ' tile-settings__size--active' : ''}`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => setTile(s.id, {enabled: !cfg.enabled})}
                            aria-pressed={cfg.enabled}
                            className={`settings-switch__toggle${cfg.enabled ? ' settings-switch__toggle--on' : ''}`}
                        >
                            <span className="settings-switch__toggle-knob"/>
                        </button>
                    </div>
                )
            })}
        </Sheet>
    )
}
