/*
 Реестр сервисов для плитки на странице «Сервисы».
 Порядок в массиве = порядок в сетке.
 Чтобы добавить сервис: либо внешняя ссылка через <LinkService ... />, либо самодостаточный
 компонент-панель (см. library-card.tsx / debts.tsx как образцы)
*/

import type { ReactElement } from 'react'
import type { I18nKey } from '@/i18n'
import { LinkService } from './link-service.tsx'
import LibraryCardService from './library-card'
import DebtsService from './debts'

export interface ServiceMeta {
  id: string
  labelKey: I18nKey
  icon: string
}

export const SERVICE_META: ServiceMeta[] = [
  { id: 'official', labelKey: 'services.officialApp', icon: '/icon.png' },
  { id: 'library', labelKey: 'services.libraryCard', icon: '/icons/book.webp' },
  { id: 'edu', labelKey: 'services.eduCourse', icon: '/icons/document.webp' },
  { id: 'studlk', labelKey: 'services.personalAccount', icon: '/icons/key.webp' },
  { id: 'debts', labelKey: 'services.debts', icon: '/icons/contract.webp' },
]

export const services: ReactElement[] = [
  <LinkService key="official" id="official" url="https://online.susu.ru" labelKey="services.officialApp" icon="/icon.png" tone="d" defaultSize={2} />,
  <LibraryCardService key="library" />,
  <LinkService key="edu" id="edu" url="https://edu.susu.ru/login/index.php" labelKey="services.eduCourse" icon="/icons/document.webp" tone="b" defaultSize={2} />,
  <LinkService key="studlk" id="studlk" url="https://studlk.susu.ru/Account/Login" labelKey="services.personalAccount" icon="/icons/key.webp" tone="a" defaultSize={2} />,
  <DebtsService key="debts" />,
]
