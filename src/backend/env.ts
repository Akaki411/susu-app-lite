// Конфигурация бэкенда из переменных окружения

const bool = (value: string | undefined, fallback = false): boolean => {
    if (value == null || value === '') return fallback
    return value === 'true' || value === '1' || value === 'yes'
}

const int = (value: string | undefined, fallback: number): number => {
    const n = Number(value)
    return Number.isFinite(n) && n > 0 ? n : fallback
}

const env = process.env

export const config = {
    isDev: bool(env.IS_DEV, false),
    susuBase: env.SUSU_API_BASE ?? 'https://online.susu.ru/microgateway',
    redisUrl: env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    sqlitePath: env.SQLITE_PATH ?? 'data/database.db',
    scheduleTtl: int(env.SCHEDULE_TTL, 3600),
    ratingTtl: int(env.RATING_TTL, 600),
    trustedIpHeader: (env.TRUSTED_IP_HEADER ?? 'x-forwarded-for').toLowerCase(),
    adminSeed: (env.ADMIN_SEED ?? '').trim(),
}

export type AppConfig = typeof config
