'use client'

import {getAccessToken, getIdentity, getProfile, getRefreshToken, saveTokens} from './token-store'
import {userNameFromToken} from './jwt'
import type {
    AdminStatsResult,
    DebtSchedule,
    LoginResult,
    NewsArticle,
    NewsPage,
    RatingData,
    RatingJournal,
    ScheduleData,
    ScheduleSearchResult,
    ScheduleSourceKind,
    StudyPlan,
} from '@/shared/types'

const DEFAULT_TIMEOUT = 8000

export class ApiRequestError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message)
        this.name = 'ApiRequestError'
    }
}

const withTimeout = (ms: number): { signal: AbortSignal; done: () => void } => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), ms)
    return {signal: ctrl.signal, done: () => clearTimeout(timer)}
};

let refreshInFlight: Promise<boolean> | null = null

const refreshTokens = async (): Promise<boolean> => {
    if (refreshInFlight) return refreshInFlight
    refreshInFlight = (async () => {
        const refreshToken = getRefreshToken()
        const userName = userNameFromToken(getAccessToken())
        const identity = getIdentity()
        if (!refreshToken || !userName) return false
        try {
            const {signal, done} = withTimeout(DEFAULT_TIMEOUT)
            const res = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({userName, identity, refreshToken}),
                signal,
            })
            done()
            if (!res.ok) return false
            const data = (await res.json()) as { ok?: boolean; accessToken?: string; refreshToken?: string }
            if (!data.ok || !data.accessToken || !data.refreshToken) return false
            saveTokens({accessToken: data.accessToken, refreshToken: data.refreshToken})
            return true
        } catch {
            return false
        } finally {
            refreshInFlight = null
        }
    })()
    return refreshInFlight
};

const authed = async (
    path: string,
    init: RequestInit = {},
    timeout = DEFAULT_TIMEOUT,
    retried = false,
): Promise<Response> => {
    const token = getAccessToken()
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const {signal, done} = withTimeout(timeout)
    let res: Response
    try {
        res = await fetch(path, {...init, headers, signal})
    } finally {
        done()
    }

    if (res.status === 401 && !retried) {
        const ok = await refreshTokens()
        if (ok) return authed(path, init, timeout, true)
    }
    return res
};

const getJson = async <T>(path: string, timeout = DEFAULT_TIMEOUT): Promise<T> => {
    const res = await authed(path, {method: 'GET'}, timeout)
    if (!res.ok) throw new ApiRequestError(`GET ${path} → ${res.status}`, res.status)
    return (await res.json()) as T
};

export const login = async (loginName: string, password: string): Promise<LoginResult> => {
    const {signal, done} = withTimeout(DEFAULT_TIMEOUT)
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({identity: getIdentity(), login: loginName, password}),
            signal,
        })
        const data = (await res.json().catch(() => ({ok: false}))) as LoginResult
        return data
    } catch {
        return {ok: false, message: 'network'}
    } finally {
        done()
    }
};

export const getSchedule = (
    id: string,
    kind: ScheduleSourceKind,
    opts: { from?: string; to?: string; force?: boolean } = {},
): Promise<ScheduleData> => {
    const q = new URLSearchParams({id, kind})
    if (opts.from) q.set('from', opts.from)
    if (opts.to) q.set('to', opts.to)
    if (opts.force) q.set('force', '1')
    return getJson<ScheduleData>(`/api/schedule?${q.toString()}`)
};

export const searchSchedule = (query: string): Promise<ScheduleSearchResult[]> => getJson<ScheduleSearchResult[]>(`/api/schedule/search?q=${encodeURIComponent(query)}`);

export const getStudyPlan = (): Promise<StudyPlan> => getJson<StudyPlan>('/api/studyplan');

export const getRating = (term: number, force = false): Promise<RatingData> => getJson<RatingData>(`/api/rating?term=${term}${force ? '&force=1' : ''}`);

export const getJournal = (disciplineId: string, term: number): Promise<RatingJournal> =>
    getJson<RatingJournal>(`/api/rating/journal?disciplineId=${disciplineId}&term=${term}`);

export const getDebts = (): Promise<DebtSchedule[]> => getJson<DebtSchedule[]>('/api/debts', 10000);

export const getAdminStats = (days = 7): Promise<AdminStatsResult> => getJson<AdminStatsResult>(`/api/admin/stats?days=${days}`);

export const getNews = (page: number): Promise<NewsPage> => getJson<NewsPage>(`/api/news?page=${page}`, 10000);

export const getArticle = (link: string): Promise<NewsArticle> =>
    getJson<NewsArticle>(`/api/news/article?link=${encodeURIComponent(link)}`, 10000);

export const qrUrlFor = (data: string): string => `/api/qr?data=${encodeURIComponent(data)}`;

export const qrUrl = (): string | null => {
    const ticket = getProfile()?.passTicket
    return ticket ? qrUrlFor(ticket) : null
};
