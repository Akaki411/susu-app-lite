export type ScheduleSourceKind = 'group' | 'instructor' | 'room'

export interface StudentProfile {
    userId: string
    userName: string
    firstName: string
    lastName: string
    middleName?: string
    photo?: string
    passTicket?: string
    libraryCardNumber?: string
    groupId: string
    groupName: string
    faculty?: string
    specialityCode?: string
    specialityName?: string
    educationForm?: string
    studyYears?: string
    email?: string
    phone?: string
    address?: string
    recordBookNumber?: string
    dormAccountNumber?: string
}

export interface AuthTokens {
    accessToken: string
    refreshToken: string
    identity: string
}

export interface LoginResult {
    ok: boolean
    message?: string
    tokens?: Pick<AuthTokens, 'accessToken' | 'refreshToken'>
    profile?: StudentProfile
}

export interface ScheduleEvent {
    date: string
    beginTime: string
    endTime: string
    subject: string
    eventType: string
    room?: string
    teacher?: string
    groups?: string[]
}

export interface ScheduleData {
    scheduleId: string
    kind: ScheduleSourceKind
    title: string
    events: ScheduleEvent[]
    fetchedAt: number
}

export interface ScheduleSearchResult {
    id: string
    kind: ScheduleSourceKind
    title: string
    subtitle: string
}

export interface StudyPlan {
    year: number
    termCount: number
    currentTerm: number
}

export interface RatingSubject {
    disciplineId: string
    name: string
    controlType: string
    termNumber: number
    rating: number
    teacher?: string
    isPractice?: boolean
    mark?: string
}

export interface RatingData {
    term: number
    subjects: RatingSubject[]
    fetchedAt: number
}

export interface JournalPoint {
    name: string
    rating: number
    point: number
    maxPoint: number
    weight: number
}

export interface RatingJournal {
    disciplineName: string
    isCredit: boolean
    currentControl: JournalPoint[]
    bonuses: JournalPoint[]
    attestation: JournalPoint[]
    labs: JournalPoint[]
    courseWorksOrProjects: JournalPoint[]
    currentRating: number
    totalRating: number
}

export interface NewsItem {
    id: string
    date: string
    title: string
    image?: string
    link: string
}

export interface NewsArticle {
    title: string
    image?: string
    contentHtml: string
}

export interface NewsPage {
    items: NewsItem[]
    page: number
    hasMore: boolean
}

export interface DebtItem {
    subject: string
    controlType: string
    term: number
    reexamDate: string
    isPrimary: boolean
    isPractice: boolean
}

export interface DebtSchedule {
    id: string
    yearDebt: number
    createdDate: string
    finalDate: string
    items: DebtItem[]
}

export interface ApiError {
    error: string
    code?: string
}

export interface DailyStat {
    date: string
    requests: number
    uniqueIps: number
    byEndpoint: Record<string, number>
}

export interface AdminStats {
    uniqueToday: number
    daily: DailyStat[]
}

export type AdminStatsResult = { isAdmin: false } | ({ isAdmin: true } & AdminStats)
