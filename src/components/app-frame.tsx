'use client'
// Каркас приложения: боковой рейл + контент + нижний навбар + глобальные шторка/кнопка пропуска

import {useEffect, type ReactNode} from 'react'
import {ErrorBoundary} from '@/components/common/error-boundary.tsx'
import BottomNav from '@/components/nav/bottom-nav.tsx'
import DesktopRail from '@/components/nav/desktop-rail.tsx'
import {PassFab} from '@/components/pass/pass-fab.tsx'
import {PassSheet} from '@/components/pass/pass-sheet.tsx'
import {setupCacheReset} from '@/lib/cache-reset'
import {navigate, useCurrentPath} from '@/lib/router'
import {isAuthenticated} from '@/lib/token-store'

export default ({children}: { children: ReactNode }) => {
    const pathname = useCurrentPath()
    const isNoOverscroll = pathname === '/schedule' || pathname === '/rating'

    useEffect(() => {
        if (typeof document === 'undefined') return
        if (isNoOverscroll) {
            document.documentElement.setAttribute('data-no-overscroll', 'true')
            document.body.setAttribute('data-no-overscroll', 'true')
        } else {
            document.documentElement.removeAttribute('data-no-overscroll')
            document.body.removeAttribute('data-no-overscroll')
        }
    }, [isNoOverscroll])

    useEffect(() => {
        const authed = isAuthenticated()
        if (!authed && pathname !== '/login') navigate('/login', {replace: true})
        else if (authed && pathname === '/login') navigate('/schedule', {replace: true})
    }, [pathname])

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
            })
            setupCacheReset()
        }
    }, [])

    if (pathname === '/login') return <>{children}</>

    return (
        <div className="app-frame">
            <DesktopRail/>
            <main className="app-frame__main">
                <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
            </main>
            <BottomNav/>
            <PassFab/>
            <PassSheet/>
        </div>
    )
}
