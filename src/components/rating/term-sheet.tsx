// Выбор семестра для страницы «Рейтинг»

import {Sheet} from '@/components/common/sheet.tsx'
import {useI18n} from '@/i18n'

export const TermSheet = ({
    open,
    onClose,
    termCount,
    currentTerm,
    selected,
    onPick,
}: {
    open: boolean
    onClose: () => void
    termCount: number
    currentTerm: number
    selected: number
    onPick: (term: number) => void
}) => {
    const {t} = useI18n()
    const terms = Array.from({length: termCount}, (_, i) => i + 1)

    return (
        <Sheet open={open} onClose={onClose} title={t('rating.selectTerm')}>
            {terms.map((n) => {
                const active = n === selected
                return (
                    <button
                        key={n}
                        type="button"
                        onClick={() => {
                            onPick(n)
                            onClose()
                        }}
                        className="radio-row"
                    >
                        <span className={`radio-row__dot${active ? ' radio-row__dot--active' : ''}`}>
                          {active && <span className="radio-row__dot-fill"/>}
                        </span>
                        <span className={`radio-row__label${active ? ' radio-row__label--active' : ''}`}>
                            {t('rating.term', {n})}
                        </span>
                        {n === currentTerm && <span className="radio-row__hint">{t('rating.termCurrent')}</span>}
                    </button>
                )
            })}
        </Sheet>
    )
}
