/*
  Стратегии:
   - /api/qr - исключение: SVG для пропуска не меняется для одного номера, кешируем
     cache-first, чтобы пропуск открывался офлайн после первого онлайн-показа
   - остальной /api/* не трогаем, за офлайн-данные отвечает IndexedDB в приложении,
     свежесть данных под контролем клиента, а не SW
   - навигации (mode=navigate) - network-first с офлайн-запуском
   - статика (скрипты/стили/иконки/шрифты) - cache-first с фоновым обновлением
  При обновлении версии CACHE старые кеши удаляются.
*/

const CACHE = 'susu-lite-v1.1'
const CORE = ['/schedule', '/rating', '/services', '/manifest.webmanifest', '/logo.webp', '/icon.png']

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(CORE).catch(() => undefined))
            .then(() => self.skipWaiting()),
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    )
})

self.addEventListener('fetch', (event) => {
    const req = event.request
    if (req.method !== 'GET') return

    const url = new URL(req.url)
    if (url.origin !== self.location.origin) return

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
    if (url.pathname.startsWith('/api/')) return

    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone()
                    caches.open(CACHE).then((c) => c.put(req, copy))
                    return res
                })
                .catch(() => caches.match(req).then((hit) => hit || caches.match('/schedule'))),
        )
        return
    }

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
