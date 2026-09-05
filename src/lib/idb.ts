'use client'

const DB_NAME = 'susu'
const DB_VERSION = 1
export type Store = 'schedule' | 'rating' | 'misc'
const STORES: Store[] = ['schedule', 'rating', 'misc']

let dbPromise: Promise<IDBDatabase | null> | null = null

const openDb = (): Promise<IDBDatabase | null> => {
    if (dbPromise) return dbPromise
    dbPromise = new Promise((resolve) => {
        if (typeof indexedDB === 'undefined') {
            resolve(null)
            return
        }
        try {
            const req = indexedDB.open(DB_NAME, DB_VERSION)
            req.onupgradeneeded = () => {
                const db = req.result
                for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s)
            }
            req.onsuccess = () => resolve(req.result)
            req.onerror = () => resolve(null)
        } catch {
            resolve(null)
        }
    })
    return dbPromise
};

export const idbGet = async <T>(store: Store, key: string): Promise<T | null> => {
    const db = await openDb()
    if (!db) return null
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(store, 'readonly')
            const req = tx.objectStore(store).get(key)
            req.onsuccess = () => resolve((req.result as T) ?? null)
            req.onerror = () => resolve(null)
        } catch {
            resolve(null)
        }
    })
};

export const idbSet = async (store: Store, key: string, value: unknown): Promise<void> => {
    const db = await openDb()
    if (!db) return
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(store, 'readwrite')
            tx.objectStore(store).put(value, key)
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
        } catch {
            resolve()
        }
    })
};

export const idbDel = async (store: Store, key: string): Promise<void> => {
    const db = await openDb()
    if (!db) return
    return new Promise((resolve) => {
        try {
            const tx = db.transaction(store, 'readwrite')
            tx.objectStore(store).delete(key)
            tx.oncomplete = () => resolve()
            tx.onerror = () => resolve()
        } catch {
            resolve()
        }
    })
};
