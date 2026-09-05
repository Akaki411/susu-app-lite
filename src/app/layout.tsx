import type {LayoutProps, Metadata} from 'rari'
import AppFrame from '@/components/app-frame.tsx'

export default function RootLayout({children}: LayoutProps) {
    return <AppFrame>{children}</AppFrame>
}

export const metadata: Metadata = {
    title: 'ЮУрГУ Онлайн',
    description: 'Расписание, рейтинг БРС, электронный пропуск и сервисы ЮУрГУ',
}
