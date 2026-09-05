'use client'

import {getProfile, readRaw, writeRaw} from '@/lib/token-store'
import type {ScheduleSourceKind} from '@/shared/types'

export interface ScheduleSource {
    id: string
    kind: ScheduleSourceKind
    title: string
}

const KEY = 'susu_schedule_source'

export const getScheduleSource = (): ScheduleSource | null => {
    const raw = readRaw(KEY)
    if (raw) {
        try {
            return JSON.parse(raw) as ScheduleSource
        } catch {
        }
    }
    const p = getProfile()
    if (p?.groupId) return {id: p.groupId, kind: 'group', title: p.groupName || p.groupId}
    return null
};

export const setScheduleSource = (source: ScheduleSource): void => {
    writeRaw(KEY, JSON.stringify(source))
};
