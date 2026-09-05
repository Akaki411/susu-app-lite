// GET /api/schedule?id=<guid>&kind=group|instructor|room[&from=YYYY-MM-DD&to=YYYY-MM-DD][&force=1]
// Кастомный вызов по фрагментам - полное расписание источника кешируется, а клиенту отдаётся
// срез по диапазону дат, для быстрого локального обновления

import {withApi} from '@/backend/api-middleware'
import {cache} from '@/backend/cache'
import {config} from '@/backend/env'
import {error, getBearer, json} from '@/backend/http'
import {isGuid, isIsoDate} from '@/backend/security'
import {getSchedule} from '@/backend/susu-client'
import type {ScheduleData, ScheduleSourceKind} from '@/shared/types'

const KINDS: ScheduleSourceKind[] = ['group', 'instructor', 'room']

export const GET = async (request: Request): Promise<Response> => withApi(request, async () => {
    const bearer = getBearer(request)
    if (!bearer) return error('Требуется авторизация', 401)

    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const kind = url.searchParams.get('kind') as ScheduleSourceKind | null
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const force = url.searchParams.get('force') === '1'

    if (!isGuid(id)) return error('Некорректный id источника', 400)
    if (!kind || !KINDS.includes(kind)) return error('Некорректный тип источника', 400)
    if (from && !isIsoDate(from)) return error('Некорректная дата from', 400)
    if (to && !isIsoDate(to)) return error('Некорректная дата to', 400)

    const cacheKey = `sched:${kind}:${id}`
    let data = force ? null : await cache.getJson<ScheduleData>(cacheKey)

    if (!data) {
        const res = await getSchedule(id, kind, bearer)
        if (res.status === 401) return json({error: 'unauthorized'}, 401)
        data = {
            scheduleId: id,
            kind,
            title: '',
            events: res.events,
            fetchedAt: Date.now(),
        }
        await cache.setJson(cacheKey, data, config.scheduleTtl)
    }

    const events =
        from || to ? data.events.filter((e) => (!from || e.date >= from) && (!to || e.date <= to)) : data.events

    return json({...data, events}, 200)
});
