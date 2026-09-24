'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {idbGet, idbSet, type Store} from './idb'

interface OfflineDataOptions<T> {
    store: Store
    cacheKey: string
    fetcher: (force: boolean) => Promise<T>
    enabled?: boolean
    auto?: boolean
    isValid?: (data: unknown) => data is T
    isEmpty?: (data: T) => boolean
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
  isValid,
  isEmpty,
}: OfflineDataOptions<T>): OfflineDataResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [fromNetwork, setFromNetwork] = useState(false)
    const [error, setError] = useState(false)

    const fetcherRef = useRef(fetcher)
    fetcherRef.current = fetcher

    const activeKeyRef = useRef(cacheKey)
    activeKeyRef.current = cacheKey

    const prevKeyRef = useRef<string | null>(null)

    const refresh = useCallback(async (force = false) => {
        if (!enabled) return
        const requestKey = cacheKey
        setRefreshing(true)
        setError(false)
        try {
            const fresh = await fetcherRef.current(force)
            if (activeKeyRef.current !== requestKey) return
            if (!fresh || (isValid && !isValid(fresh))) {
                setError(true)
                return
            }
            setData((current) => {
                if (isEmpty && isEmpty(fresh) && current && !isEmpty(current)) {
                    return current
                }
                void idbSet(store, requestKey, fresh)
                return fresh
            })
            setFromNetwork(true)
        } catch {
            if (activeKeyRef.current === requestKey) setError(true)
        } finally {
            if (activeKeyRef.current === requestKey) setRefreshing(false)
        }
    }, [enabled, store, cacheKey, isValid, isEmpty])

    useEffect(() => {
        let cancelled = false
        if (prevKeyRef.current !== cacheKey) {
            prevKeyRef.current = cacheKey
            setData(null)
            setLoading(true)
        }

        const loadCached = async () => {
            let cached = await idbGet<T>(store, cacheKey)
            if (!cached && cacheKey !== cacheKey.toLowerCase()) {
                cached = await idbGet<T>(store, cacheKey.toLowerCase())
            }
            if (cancelled) return
            if (cached != null) {
                if (!isValid || isValid(cached)) {
                    setData(cached)
                }
            }
            setLoading(false)
            if (auto && enabled) void refresh()
        }

        void loadCached()

        return () => {
            cancelled = true
        }
    }, [store, cacheKey, enabled, auto, refresh, isValid])

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
