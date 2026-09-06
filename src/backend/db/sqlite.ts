// Подключение к SQLite через встроенный node:sqlite доступный в рантайме rari

import {mkdirSync} from 'node:fs'
import {dirname} from 'node:path'
import {DatabaseSync} from 'node:sqlite'
import {config} from '../env'

try {
    mkdirSync(dirname(config.sqlitePath), {recursive: true})
} catch (e) {
    if ((e as NodeJS.ErrnoException)?.code !== 'EEXIST') throw e
}

const g = globalThis as unknown as { __susuDb?: DatabaseSync }
export const db: DatabaseSync = g.__susuDb ?? (g.__susuDb = new DatabaseSync(config.sqlitePath))

if (!(globalThis as unknown as { __susuDbInit?: boolean }).__susuDbInit) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
           userId TEXT PRIMARY KEY,
           addedAt TEXT NOT NULL
        )
    `)
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_stats (
           date TEXT PRIMARY KEY,
           requests INTEGER NOT NULL DEFAULT 0,
           uniqueIps INTEGER NOT NULL DEFAULT 0,
           byEndpoint TEXT NOT NULL DEFAULT '{}'
        )
    `)
    db.exec(`
        CREATE TABLE IF NOT EXISTS analytics_hll (
           id TEXT PRIMARY KEY,
           sketch TEXT NOT NULL,
           updatedAt TEXT NOT NULL
        )
    `)
    db.exec(`
        CREATE TABLE IF NOT EXISTS analytics_counters (
           category TEXT NOT NULL,
           key TEXT NOT NULL,
           count INTEGER NOT NULL DEFAULT 0,
           PRIMARY KEY (category, key)
        )
    `)
    if (config.adminSeed) {
        db.prepare(
            `INSERT INTO admin_users (userId, addedAt)
             VALUES (?, ?) ON CONFLICT(userId) DO
            UPDATE SET addedAt = excluded.addedAt`,
        ).run(config.adminSeed, new Date().toISOString())
    }
    ;(globalThis as unknown as { __susuDbInit?: boolean }).__susuDbInit = true
}