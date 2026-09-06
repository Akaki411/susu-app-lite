'use client'

import {getProfile} from '@/lib/token-store'
import type {ScheduleSourceKind} from '@/shared/types'

export interface ScheduleSource {
    id: string
    kind: ScheduleSourceKind
    title: string
    subtitle?: string
}

const VIEW_KEY = 'susu_schedule_view'
const RECENT_KEY = 'susu_schedule_recent'
const RECENT_LIMIT = 5

const sameSource = (a: ScheduleSource, b: ScheduleSource): boolean => a.kind === b.kind && a.id === b.id

const readJson = <T>(storage: Storage | undefined, key: string): T | null => {
    if (!storage) return null
    try {
        const raw = storage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : null
    } catch {
        return null
    }
};

const writeJson = (storage: Storage | undefined, key: string, value: unknown): void => {
    if (!storage) return
    try {
        storage.setItem(key, JSON.stringify(value))
    } catch {
    }
};

const session = (): Storage | undefined => (typeof window !== 'undefined' ? window.sessionStorage : undefined);
const local = (): Storage | undefined => (typeof window !== 'undefined' ? window.localStorage : undefined);

export const getOwnScheduleSource = (): ScheduleSource | null => {
    const p = getProfile()
    return p?.groupId ? {id: p.groupId, kind: 'group', title: p.groupName || p.groupId} : null
};

export const getScheduleSource = (): ScheduleSource | null => readJson<ScheduleSource>(session(), VIEW_KEY) ?? getOwnScheduleSource();

export const getRecentScheduleSources = (): ScheduleSource[] => readJson<ScheduleSource[]>(local(), RECENT_KEY) ?? [];

const pushRecent = (source: ScheduleSource): void => {
    const list = getRecentScheduleSources().filter((s) => !sameSource(s, source))
    list.unshift(source)
    writeJson(local(), RECENT_KEY, list.slice(0, RECENT_LIMIT))
};

export const setViewedScheduleSource = (source: ScheduleSource): void => {
    writeJson(session(), VIEW_KEY, source)
    const own = getOwnScheduleSource()
    if (!own || !sameSource(own, source)) pushRecent(source)
};

export const clearViewedScheduleSource = (): void => {
    session()?.removeItem(VIEW_KEY)
};
