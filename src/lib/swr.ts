'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {idbGet, idbSet, type Store} from './idb'

interface OfflineDataOptions<T> {
    store: Store
    cacheKey: string
    fetcher: (force: boolean) => Promise<T>
    enabled?: boolean
    auto?: boolean
}

interface OfflineDataResult<T> {
    data: T | null
    loading: boolean
    refreshing: boolean
    fromNetwork: boolean
    error: boolean
    refresh: (force?: boolean) => Promise<void>
}

export function useOfflineData<T>({
  store,
  cacheKey,
  fetcher,
  enabled = true,
  auto = true,
}: OfflineDataOptions<T>): OfflineDataResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [fromNetwork, setFromNetwork] = useState(false)
    const [error, setError] = useState(false)

    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher

    const refresh = useCallback(async (force = false) => {
        if (!enabled) return
        setRefreshing(true)
        setError(false)
        try {
            const fresh = await fetcherRef.current(force)
            setData(fresh)
            setFromNetwork(true)
            void idbSet(store, cacheKey, fresh)
        } catch {
            setError(true)
        } finally {
            setRefreshing(false)
        }
    }, [enabled, store, cacheKey])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        idbGet<T>(store, cacheKey).then((cached) => {
            if (cancelled) return
            if (cached != null) setData(cached)
            setLoading(false)
            if (auto && enabled) void refresh()
        })
        return () => {
            cancelled = true
        }
    }, [store, cacheKey, enabled])

    return {data, loading, refreshing, fromNetwork, error, refresh}
}

export const useForceRefreshIfEmpty = (
    key: string,
    isEmpty: boolean,
    refreshing: boolean,
    refresh: (force?: boolean) => Promise<void>,
): void => {
    const forcedFor = useRef<string | null>(null)

    useEffect(() => {
        if (refreshing || !isEmpty || forcedFor.current === key) return
        forcedFor.current = key
        void refresh(true)
    }, [key, isEmpty, refreshing, refresh])
};
