'use client'
// Ссылка на внешний ресурс ЮУрГУ
import {useI18n, type I18nKey} from '@/i18n'
import {tileConfig, useSettings} from '@/lib/settings'
import {ServiceTileBase} from './service-tile-base.tsx'
import type {TileSize, TileTone} from './types'

export const LinkService = ({
    id,
    url,
    labelKey,
    icon,
    tone = 'a',
    defaultSize = 2,
}: {
    id: string
    url: string
    labelKey: I18nKey
    icon: string
    tone?: TileTone
    defaultSize?: TileSize
}) => {
    const {t} = useI18n()
    const {settings} = useSettings()
    const cfg = tileConfig(settings, id, defaultSize)
    if (!cfg.enabled) return null

    return (
        <ServiceTileBase
            size={cfg.size}
            tone={tone}
            icon={icon}
            label={t(labelKey)}
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
        />
    )
}
