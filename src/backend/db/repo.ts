// Мини ORM для взаимодействий с БД. Дневную статистику буферизуем в ОЗУ и периодически
// сбрасываем в SQLite чтобы не делать запись в БД на каждый HTTP-запрос

import {getAnalyticsSummary} from '../analytics'
import {countUniqueIp} from '../hll'
import {db} from './sqlite'

const today = (): string => new Date().toISOString().slice(0, 10)

interface DailyStatRow {
    date: string
    requests: number
    uniqueIps: number
    byEndpoint: string
}

const buffer = new Map<string, { requests: number; byEndpoint: Record<string, number> }>()

export const recordRequest = (endpoint: string): void => {
    const key = today()
    let day = buffer.get(key)
    if (!day) {
        day = {requests: 0, byEndpoint: {}}
        buffer.set(key, day)
    }
    day.requests++
    day.byEndpoint[endpoint] = (day.byEndpoint[endpoint] ?? 0) + 1
}

const flush = async (): Promise<void> => {
    for (const [date, acc] of buffer) {
        buffer.delete(date)
        if (acc.requests === 0) continue
        const uniqueIps = await countUniqueIp(date)
        const existing = db.prepare('SELECT * FROM daily_stats WHERE date = ?').get(date) as
            | DailyStatRow
            | undefined
        if (existing) {
            const prevEndpoints = JSON.parse(existing.byEndpoint) as Record<string, number>
            for (const [ep, n] of Object.entries(acc.byEndpoint)) prevEndpoints[ep] = (prevEndpoints[ep] ?? 0) + n
            db.prepare('UPDATE daily_stats SET requests = ?, uniqueIps = ?, byEndpoint = ? WHERE date = ?').run(
                existing.requests + acc.requests,
                uniqueIps,
                JSON.stringify(prevEndpoints),
                date,
            )
        } else {
            db.prepare('INSERT INTO daily_stats (date, requests, uniqueIps, byEndpoint) VALUES (?, ?, ?, ?)').run(
                date,
                acc.requests,
                uniqueIps,
                JSON.stringify(acc.byEndpoint),
            )
        }
    }
}

if (!(globalThis as unknown as { __susuStatsFlusher?: boolean }).__susuStatsFlusher) {
    setInterval(() => {
        flush().catch(() => {
        })
    }, 10_000).unref?.()
    ;(globalThis as unknown as { __susuStatsFlusher?: boolean }).__susuStatsFlusher = true
}

export const isAdmin = (userId: string | null): boolean => {
    if (!userId) return false
    const found = db.prepare('SELECT 1 FROM admin_users WHERE userId = ?').get(userId)
    return found != null
}

export const getStats = async (days = 30) => {
    const rows = db.prepare('SELECT * FROM daily_stats ORDER BY date DESC LIMIT ?').all(days) as unknown as DailyStatRow[]
    const daily = rows.map((r) => ({...r, byEndpoint: JSON.parse(r.byEndpoint) as Record<string, number>}))
    const uniqueToday = await countUniqueIp()
    return {uniqueToday, daily, ...getAnalyticsSummary()}
}
