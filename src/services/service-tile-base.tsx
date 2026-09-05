// Готовая плитка сервиса. Сервис-компонент рисует ею себя -
// нужно передать размер/цвет/иконку/подпись и обработчик клика

import type {TileSize, TileTone} from './types'

export const ServiceTileBase = ({
    size = 1,
    tone = 'a',
    icon,
    label,
    onClick,
}: {
    size?: TileSize
    tone?: TileTone
    icon: string
    label: string
    onClick: () => void
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`service-tile service-tile--span-${size} service-tile--tone-${tone}`}
    >
        <span aria-hidden="true" className="service-tile__shade"/>
        <img src={icon} alt="" className={`service-tile__icon service-tile__icon--size-${size}`}/>
        <span className={`service-tile__label service-tile__label--size-${size}`}>{label}</span>
    </button>
)
