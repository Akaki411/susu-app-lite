// GET /api/admin/stats[?days=N] - дневная статистика уникальных IP

import {withApi} from '@/backend/api-middleware'
import {isAdmin, getStats} from '@/backend/db/repo'
import {getBearer, json} from '@/backend/http'
import {userIdFromAuth} from '@/backend/jwt'

export async function GET(request: Request): Promise<Response> {
    return withApi(request, async () => {
        const bearer = getBearer(request)
        const userId = userIdFromAuth(bearer)

        if (!isAdmin(userId)) return json({error: 'forbidden'}, 403)

        const days = Number(new URL(request.url).searchParams.get('days')) || 30
        const stats = await getStats(Math.min(Math.max(days, 1), 365))
        return json(stats, 200)
    })
}
