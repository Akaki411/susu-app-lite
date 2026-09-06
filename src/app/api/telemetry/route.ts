// POST /api/telemetry - лёгкий маячок для статистики использования настроек

import {addToHll, incrementCounter} from '@/backend/analytics'
import {withApi} from '@/backend/api-middleware'
import {error, getBearer, json} from '@/backend/http'
import {userIdFromAuth} from '@/backend/jwt'

const EVENTS = new Set(['theme', 'passButtonMode', 'tileResize', 'notifications', 'feedEnabled', 'language'])
const APPEARANCE_EVENTS = new Set(['theme', 'tileResize'])
const MAX_VALUE_LEN = 32

export async function POST(request: Request): Promise<Response> {
    return withApi(request, async () => {
        const userId = userIdFromAuth(getBearer(request))
        if (!userId) return error('Требуется авторизация', 401)

        const body = (await request.json().catch(() => null)) as { event?: string; value?: string } | null
        const event = body?.event
        const value = body?.value
        if (!event || !EVENTS.has(event) || typeof value !== 'string' || !value || value.length > MAX_VALUE_LEN) {
            return error('Некорректное событие', 400)
        }

        incrementCounter(event, value)
        if (APPEARANCE_EVENTS.has(event)) addToHll('appearance:changers', userId)

        return json({ok: true}, 200)
    })
}
