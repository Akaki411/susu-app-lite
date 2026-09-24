/*
  Стратегии:
   - /api/qr - исключение: SVG для пропуска не меняется для одного номера, кешируем
     cache-first, чтобы пропуск открывался офлайн после первого онлайн-показа
   - остальной /api/* не трогаем, за офлайн-данные отвечает IndexedDB в приложении,
     свежесть данных под контролем клиента, а не SW
   - RSC Flight запросы - stale-while-revalidate в отдельном RSC_CACHE, чтобы не конфликтовать с 
    HTML-оболочкой и обеспечивать мгновенный переход между страницами
   - навигации (mode=navigate) - network-first с офлайн-запуском сохранённой HTML-оболочки
   - статика (скрипты/стили/иконки/шрифты) - cache-first с фоновым обновлением
  При обновлении версии CACHE старые кеши удаляются.
*/

const VERSION = 'v1.5.0'
const CACHE = 'susu-lite-' + VERSION
const RSC_CACHE = 'susu-rsc-' + VERSION
const CORE = [
    '/schedule',
    '/rating',
    '/services',
    '/feed',
    '/manifest.webmanifest',
    '/logo.webp',
    '/icon.png',
]
const ROUTES = ['/schedule', '/rating', '/services', '/feed']

const broadcastVersion = async () => {
    const clients = await self.clients.matchAll({includeUncontrolled: true})
    for (const client of clients) client.postMessage({type: 'SW_VERSION', version: VERSION})
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE).then((cache) => cache.addAll(CORE).catch(() => undefined)),
            caches.open(RSC_CACHE).then(async (rscCache) => {
                await Promise.all(
                    ROUTES.map((route) =>
                        fetch(route, {headers: {Accept: 'text/x-component'}})
                            .then((res) => {
                                if (res.status === 200) {
                                    return rscCache.put(route, res)
                                }
                            })
                            .catch(() => undefined),
                    ),
                )
            }),
        ]).then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k !== CACHE && k !== RSC_CACHE)
                        .map((k) => caches.delete(k)),
                ),
            )
            .then(() => self.clients.claim())
            .then(() => broadcastVersion()),
    )
})

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_VERSION') {
        const target = event.source
        if (target) target.postMessage({type: 'SW_VERSION', version: VERSION})
    }
})

self.addEventListener('fetch', (event) => {
    const req = event.request
    if (req.method !== 'GET') return

    const url = new URL(req.url)
    if (url.origin !== self.location.origin) return

    // 1. QR SVG code: cache-first
    if (url.pathname === '/api/qr') {
        event.respondWith(
            caches.match(req).then(
                (hit) =>
                    hit ||
                    fetch(req).then((res) => {
                        if (res.status === 200) {
                            const copy = res.clone()
                            caches.open(CACHE).then((c) => c.put(req, copy))
                        }
                        return res
                    }),
            ),
        )
        return
    }

    // 2. Ignore other API routes (IndexedDB handles offline data)
    if (url.pathname.startsWith('/api/')) return

    // 3. Rari RSC Flight component requests (Accept: text/x-component or rari-navigation-id)
    const isRsc =
        req.headers.get('Accept')?.includes('text/x-component') ||
        req.headers.has('rari-navigation-id')

    if (isRsc) {
        event.respondWith(
            caches.open(RSC_CACHE).then((cache) =>
                cache.match(url.pathname).then((hit) => {
                    const network = fetch(req)
                        .then((res) => {
                            if (
                                res &&
                                res.status === 200 &&
                                res.headers.get('content-type')?.includes('text/x-component')
                            ) {
                                const copy = res.clone()
                                cache.put(url.pathname, copy)
                            }
                            return res
                        })
                        .catch(() => hit)
                    return hit || network
                }),
            ),
        )
        return
    }

    // 4. Full page navigations (HTML mode=navigate)
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    if (
                        res &&
                        res.status === 200 &&
                        res.headers.get('content-type')?.includes('text/html')
                    ) {
                        const copy = res.clone()
                        caches.open(CACHE).then((c) => c.put(req, copy))
                    }
                    return res
                })
                .catch(() => caches.match(req).then((hit) => hit || caches.match('/schedule'))),
        )
        return
    }

    // 5. Static assets (JS, CSS, images, fonts)
    event.respondWith(
        caches.match(req).then((hit) => {
            const network = fetch(req)
                .then((res) => {
                    if (res && res.status === 200) {
                        const copy = res.clone()
                        caches.open(CACHE).then((c) => c.put(req, copy))
                    }
                    return res
                })
                .catch(() => hit)
            return hit || network
        }),
    )
})
