// SSR-генерация QR-кода пропуска в «точечном» стиле с векторным логотипом ЮУрГУ в центре

import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import QRCode from 'qrcode'

const MARGIN = 2
const TARGET_VERSION = 5

const LOGO_CANDIDATES = [join(process.cwd(), 'public/logo.svg'), join(process.cwd(), 'dist/logo.svg')]

interface Logo {
    inner: string
    viewBox: string
}

let logoCache: Logo | null | undefined

const loadLogo = (): Logo | null => {
    if (logoCache !== undefined) return logoCache
    const path = LOGO_CANDIDATES.find(existsSync)
    if (!path) {
        console.error('[qr] logo.svg не найден ни по одному из путей:', LOGO_CANDIDATES)
        logoCache = null
        return null
    }
    const raw = readFileSync(path, 'utf-8')
    const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1] ?? '0 0 128 128'
    const inner = raw
        .replace(/<\?xml[\s\S]*?\?>/, '')
        .replace(/<svg[^>]*>/, '')
        .replace(/<\/svg>\s*$/, '')
        .trim()
    logoCache = inner ? {inner, viewBox} : null
    return logoCache
}

const f = (n: number): string => String(Math.round(n * 1000) / 1000)

const rrect = (x: number, y: number, s: number, r: number, attrs: string): string =>
    `<rect x="${f(x)}" y="${f(y)}" width="${f(s)}" height="${f(s)}" rx="${f(r)}" ry="${f(r)}" ${attrs}/>`

const isFinder = (r: number, c: number, n: number): boolean =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

const eye = (ox: number, oy: number): string =>
    rrect(ox + 0.5, oy + 0.5, 6, 1.6, `fill="none" stroke="currentColor" stroke-width="1"`) +
    rrect(ox + 2, oy + 2, 3, 1, `fill="currentColor"`)

const buildSvg = (data: string): string => {
    let qr
    try {
        qr = QRCode.create(data, {errorCorrectionLevel: 'H', version: TARGET_VERSION})
    } catch {
        qr = QRCode.create(data, {errorCorrectionLevel: 'H'})
    }
    const n = qr.modules.size
    const bits = qr.modules.data
    const get = (r: number, c: number): boolean => !!bits[r * n + c]

    const total = n + MARGIN * 2
    const center = total / 2

    const badge = Math.max(6, Math.round(n * 0.3))
    const half = badge / 2
    const clearMin = center - half - 0.5
    const clearMax = center + half + 0.5
    const inClearZone = (ux: number, uy: number): boolean =>
        ux >= clearMin && ux <= clearMax && uy >= clearMin && uy <= clearMax

    let dots = ''
    for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
            if (!get(r, c) || isFinder(r, c, n)) continue
            const cx = MARGIN + c + 0.5
            const cy = MARGIN + r + 0.5
            if (inClearZone(cx, cy)) continue
            dots += `<circle cx="${f(cx)}" cy="${f(cy)}" r="0.42" fill="currentColor"/>`
        }
    }

    const eyes = eye(MARGIN, MARGIN) + eye(MARGIN + n - 7, MARGIN) + eye(MARGIN, MARGIN + n - 7)

    const logo = loadLogo()
    let centerBlock = ''
    if (logo) {
        const ls = badge
        const lp = center - ls / 2
        centerBlock =
            `<svg x="${f(lp)}" y="${f(lp)}" width="${f(ls)}" height="${f(ls)}" viewBox="${logo.viewBox}" ` +
            `preserveAspectRatio="xMidYMid meet"><g fill="currentColor">${logo.inner}</g></svg>`
    }

    return (
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(total)} ${f(total)}" width="100%" height="100%" ` +
        `shape-rendering="geometricPrecision" fill="currentColor">` +
        eyes +
        dots +
        centerBlock +
        `</svg>`
    )
}

export const generateQrSvg = async (data: string): Promise<string> => buildSvg(data)
