'use client'
// Обёртка над rari router: navigate() + useCurrentPath()
import {useEffect, useState} from 'react'
import * as rariRouter from 'rari/router'

const ensureHistoryPatched = (): void => {
    if (typeof window === 'undefined') return
    const w = window as unknown as { __rariHistoryPatched?: boolean }
    if (w.__rariHistoryPatched) return
    w.__rariHistoryPatched = true
    for (const method of ['pushState', 'replaceState'] as const) {
        const original = history[method]
        history[method] = function patched(this: History, ...args: Parameters<History['pushState']>) {
            const result = original.apply(this, args)
            window.dispatchEvent(new Event('rari:locationchange'))
            return result
        } as History[typeof method]
    }
}

export const navigate = (href: string, opts?: { replace?: boolean }): void => {
    void Promise.resolve(rariRouter.navigate(href, opts)).then(() => {
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('rari:locationchange'))
    })
};

export const useCurrentPath = (): string => {
    const [path, setPath] = useState<string>(() =>
        typeof window !== 'undefined' ? window.location.pathname : '/',
    )
    useEffect(() => {
        ensureHistoryPatched()
        const update = () => setPath(window.location.pathname)
        update()
        window.addEventListener('popstate', update)
        window.addEventListener('rari:locationchange', update)
        return () => {
            window.removeEventListener('popstate', update)
            window.removeEventListener('rari:locationchange', update)
        }
    }, [])
    return path
};
