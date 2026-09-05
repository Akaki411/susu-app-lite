// SSR-генерация QR-кода пропуска 25х25 с логотипом ЮУрГУ в центре

import {existsSync, readFileSync} from 'node:fs'
import {join} from 'node:path'
import QRCode from 'qrcode'

const LOGO_CANDIDATES = [join(process.cwd(), 'public/icon.png'), join(process.cwd(), 'dist/icon.png')]

let logoDataUri: string | null | undefined

const loadLogoDataUri = (): string | null => {
    if (logoDataUri !== undefined) return logoDataUri
    const path = LOGO_CANDIDATES.find(existsSync)
    logoDataUri = path ? `data:image/png;base64,${readFileSync(path).toString('base64')}` : null
    if (!logoDataUri) console.error('[qr] icon.png не найден ни по одному из путей:', LOGO_CANDIDATES)
    return logoDataUri
}

const withLogo = (svg: string, logoDataUri: string): string => {
    const viewBoxMatch = /viewBox="0 0 (\d+) \d+"/.exec(svg)
    const size = viewBoxMatch?.[1] ? Number(viewBoxMatch[1]) : 27

    const box = size * 0.26
    const offset = (size - box) / 2
    const pad = box * 0.08
    const imgSize = box - pad * 2
    const imgPos = offset + pad

    const overlay =
        `<defs><clipPath id="qrLogoClip"><rect x="${imgPos}" y="${imgPos}" width="${imgSize}" height="${imgSize}" rx="${imgSize * 0.22}"/></clipPath></defs>` +
        `<rect x="${offset}" y="${offset}" width="${box}" height="${box}" rx="${box * 0.2}" fill="#fff"/>` +
        `<image x="${imgPos}" y="${imgPos}" width="${imgSize}" height="${imgSize}" href="${logoDataUri}" ` +
        `preserveAspectRatio="xMidYMid slice" clip-path="url(#qrLogoClip)"/>`

    return svg.replace('</svg>', `${overlay}</svg>`)
}

const buildSvg = (data: string, version?: number): Promise<string> =>
    QRCode.toString(data, {
        type: 'svg',
        margin: 1,
        width: 240,
        ...(version ? {version} : {}),
        errorCorrectionLevel: 'H',
        color: {dark: '#101014', light: '#ffffff'},
    })

export const generateQrSvg = async (data: string): Promise<string> => {
    let svg: string
    try {
        svg = await buildSvg(data, 2)
    } catch {
        svg = await buildSvg(data)
    }
    const logo = loadLogoDataUri()
    return logo ? withLogo(svg, logo) : svg
}
