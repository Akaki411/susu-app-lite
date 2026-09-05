// Клиент внешнего API ЮУрГУ - шлюз /microgateway

import {config} from './env'
import type {
    DebtItem,
    DebtSchedule,
    JournalPoint,
    RatingJournal,
    RatingSubject,
    ScheduleEvent,
    ScheduleSearchResult,
    ScheduleSourceKind,
    StudentProfile,
    StudyPlan,
} from '../shared/types'

const UPSTREAM_TIMEOUT_MS = 12_000

const form = (obj: Record<string, string>): string => new URLSearchParams(obj).toString()

const fetchWithTimeout = async (url: string, init: RequestInit): Promise<Response> => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS)
    try {
        return await fetch(url, {...init, signal: ctrl.signal})
    } finally {
        clearTimeout(timer)
    }
}

const get = (path: string, bearer: string): Promise<Response> =>
    fetchWithTimeout(`${config.susuBase}${path}`, {
        method: 'GET',
        headers: {Authorization: bearer, Accept: 'application/json'},
    })

const post = (path: string, body: Record<string, string>, bearer?: string): Promise<Response> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
    }
    if (bearer) headers.Authorization = bearer
    return fetchWithTimeout(`${config.susuBase}${path}`, {method: 'POST', headers, body: form(body)})
}

export interface RawLogin {
    isLogged?: boolean
    accessToken?: string
    refreshToken?: string
    message?: string
    translatedMessage?: string
    photo?: string
    passTicket?: string
    libraryCardNumber?: string
    firstName?: string
    middleName?: string
    lastName?: string
    userName?: string
    student?: Array<Record<string, unknown>>
}

export const login = async (identity: string, loginName: string, password: string): Promise<RawLogin> => {
    const res = await post('/api/auth/login', {
        identity,
        'LoginForm[login]': loginName,
        'LoginForm[password]': password,
    })
    return (await res.json().catch(() => ({}))) as RawLogin
}

export const refresh = async (userName: string, identity: string, refreshToken: string) => {
    const res = await post('/api/auth/UpdateToken', {userName, identity, refreshToken})
    return (await res.json().catch(() => ({}))) as {
        isLogged?: boolean
        accessToken?: string
        refreshToken?: string
    }
}

export const normalizeProfile = (raw: RawLogin): StudentProfile | null => {
    const s = raw.student?.[0] as Record<string, string> | undefined
    if (!s || typeof s.groupId !== 'string') return null
    return {
        userId: (raw as unknown as { id?: string }).id ?? '',
        userName: raw.userName ?? '',
        firstName: raw.firstName ?? '',
        lastName: raw.lastName ?? '',
        middleName: raw.middleName,
        photo: raw.photo,
        passTicket: raw.passTicket,
        libraryCardNumber: raw.libraryCardNumber,
        groupId: s.groupId,
        groupName: s.groupName ?? '',
        faculty: s.parentName,
        specialityCode: s.specialityCode,
        specialityName: s.specialityName,
        educationForm: s.educationForm,
        studyYears: s.studyYears,
    }
}

const SCHEDULE_ENDPOINT: Record<ScheduleSourceKind, string> = {
    group: '/api/Schedule/GetGroupSchedule',
    instructor: '/api/Schedule/GetInstructorSchedule',
    room: '/api/Schedule/GetRoomSchedule',
}

const hhmm = (t: unknown): string => (typeof t === 'string' ? t.slice(0, 5) : '')

const normalizeEvent = (raw: Record<string, unknown>, kind: ScheduleSourceKind): ScheduleEvent => {
    const instructors = (raw.instructors as Array<Record<string, unknown>> | undefined) ?? []
    const first = instructors[0]
    const teacher =
        kind === 'instructor'
            ? undefined
            : (first?.name as string | undefined)
    const room =
        kind === 'room'
            ? undefined
            : ((raw.location as string | undefined) ?? (first?.location as string | undefined))
    return {
        date: String(raw.eventDate ?? ''),
        beginTime: hhmm(raw.beginTime),
        endTime: hhmm(raw.endTime),
        subject: String(raw.subject ?? ''),
        eventType: String(raw.eventType ?? ''),
        room: room && room !== '-' ? room : undefined,
        teacher: teacher && teacher !== '-' ? teacher : undefined,
        groups: raw.groups as string[] | undefined,
    }
}

export const getSchedule = async (
    id: string,
    kind: ScheduleSourceKind,
    bearer: string,
): Promise<{ status: number; events: ScheduleEvent[] }> => {
    const res = await get(`${SCHEDULE_ENDPOINT[kind]}/${id}`, bearer)
    if (res.status !== 200) return {status: res.status, events: []}
    const raw = (await res.json().catch(() => [])) as Array<Record<string, unknown>>
    const events = Array.isArray(raw) ? raw.map((e) => normalizeEvent(e, kind)) : []
    events.sort((a, b) => (a.date === b.date ? a.beginTime.localeCompare(b.beginTime) : a.date.localeCompare(b.date)))
    return {status: 200, events}
}

export const searchSchedules = async (query: string, bearer: string): Promise<ScheduleSearchResult[]> => {
    const res = await post('/api/Schedule/SearchSchedules', {searchValue: query}, bearer)
    if (res.status !== 200) return []
    const raw = (await res.json().catch(() => [])) as Array<Record<string, unknown>>
    if (!Array.isArray(raw)) return []
    return raw.map((r) => {
        const kind: ScheduleSourceKind = r.isLecturer ? 'instructor' : r.isRoom ? 'room' : 'group'
        return {
            id: String(r.id ?? ''),
            kind,
            title: String(r.shortName ?? r.fullName ?? ''),
            subtitle: String(r.description ?? ''),
        }
    })
}

export const getStudyPlan = async (bearer: string): Promise<StudyPlan | null> => {
    const res = await get('/api/StudyActivity/StudyPlan', bearer)
    if (res.status !== 200) return null
    const raw = (await res.json().catch(() => null)) as StudyPlan | null
    return raw && typeof raw.termCount === 'number' ? raw : null
}

const instructorName = (list: Array<Record<string, string>> | undefined): string | undefined => {
    const i = list?.[0]
    if (!i) return undefined
    return [i.lastName, i.firstName, i.middleName].filter(Boolean).join(' ') || undefined
}

export const getRating = async (term: number, bearer: string): Promise<RatingSubject[]> => {
    const [subjRes, pracRes] = await Promise.all([
        get(`/api/StudyActivity/Subjects/${term}/ru`, bearer),
        get('/api/StudyActivity/Practices/ru', bearer),
    ])

    const subjects: RatingSubject[] = []

    if (subjRes.status === 200) {
        const raw = (await subjRes.json().catch(() => [])) as Array<Record<string, unknown>>
        for (const r of Array.isArray(raw) ? raw : []) {
            if (Number(r.termNumber) !== term) continue
            subjects.push({
                disciplineId: String(r.disciplineId ?? ''),
                name: String(r.disciplineName ?? ''),
                controlType: String(r.controlType ?? ''),
                termNumber: Number(r.termNumber) || term,
                rating: Number(r.rating) || 0,
                teacher: instructorName(r.instructors as Array<Record<string, string>>),
            })
        }
    }

    if (pracRes.status === 200) {
        const raw = (await pracRes.json().catch(() => [])) as Array<Record<string, unknown>>
        for (const r of Array.isArray(raw) ? raw : []) {
            if (Number(r.termNumber) !== term) continue
            subjects.push({
                disciplineId: String(r.disciplineId ?? ''),
                name: String(r.disciplineName ?? ''),
                controlType: 'практика',
                termNumber: Number(r.termNumber) || term,
                rating: Number(r.rating) || 0,
                teacher: instructorName(r.instructors as Array<Record<string, string>>),
                isPractice: true,
            })
        }
    }

    return subjects
}

const journalPoints = (raw: unknown): JournalPoint[] =>
    (Array.isArray(raw) ? raw : []).map((r) => {
        const p = r as Record<string, unknown>
        return {
            name: String(p.name ?? ''),
            rating: Number(p.rating) || 0,
            point: Number(p.point) || 0,
            maxPoint: Number(p.maxPoint) || 0,
            weight: Number(p.weight) || 0,
        }
    })

export const getJournal = async (disciplineId: string, term: number, bearer: string): Promise<RatingJournal | null> => {
    const res = await get(`/api/StudyActivity/Journal/${disciplineId}/${term}/IsCourseWorkOrProject/false/ru`, bearer)
    if (res.status !== 200) return null
    const raw = (await res.json().catch(() => null)) as Record<string, unknown> | null
    if (!raw || typeof raw.disciplineName !== 'string') return null
    return {
        disciplineName: raw.disciplineName,
        isCredit: Boolean(raw.isCredit),
        currentControl: journalPoints(raw.currentControl),
        bonuses: journalPoints(raw.bonuses),
        attestation: journalPoints(raw.attestation),
        labs: journalPoints(raw.labs),
        courseWorksOrProjects: journalPoints(raw.courseWorksOrProjects),
        currentRating: Number(raw.currentRating) || 0,
        totalRating: Number(raw.totalRating) || 0,
    }
}

const debtItems = (raw: unknown, isPractice: boolean): DebtItem[] =>
    (Array.isArray(raw) ? raw : []).map((r) => {
        const d = r as Record<string, unknown>
        return {
            subject: String(d.subjectNames ?? ''),
            controlType: String(d.typeSubject ?? ''),
            term: Number(d.term) || 0,
            reexamDate: String(d.reexamDate ?? ''),
            isPrimary: String(d.isDebtPrimary ?? '') === 'первичный',
            isPractice,
        }
    })

export const getDebtSchedules = async (bearer: string): Promise<DebtSchedule[]> => {
    const res = await get('/api/StudyActivity/GetListSheduleDebts', bearer)
    if (res.status !== 200) return []
    const raw = (await res.json().catch(() => [])) as Array<Record<string, unknown>>
    if (!Array.isArray(raw)) return []
    const schedules = raw.map((r) => ({
        id: String(r.idShedule ?? ''),
        yearDebt: Number(r.yearDebt) || 0,
        createdDate: String(r.createDate ?? ''),
        finalDate: String(r.finalDate ?? ''),
        items: [...debtItems(r.subjectsDates, false), ...debtItems(r.practicesDates, true)],
    }))
    schedules.sort((a, b) => b.finalDate.localeCompare(a.finalDate))
    return schedules
}
