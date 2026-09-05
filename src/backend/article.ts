// Парсер полного текста статей

import sanitizeHtml from 'sanitize-html'
import {isSusuLink} from './security'

const TIMEOUT_MS = 12_000

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

export interface ParsedArticle {
    title: string
    image?: string
    contentHtml: string
}

const decodeEntities = (s: string): string =>
    s
        .replace(/&nbsp;/g, ' ')
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&hellip;/g, '…')
        .replace(/&quot;/g, '"')
        .replace(/&#8217;/g, '’')
        .replace(/&amp;/g, '&')
        .trim()

const deobfuscateContacts = (s: string): string =>
    s
        .replace(/\s*[[({]\s*(?:at|собака)\s*[\])}]\s*/gi, '@')
        .replace(/\s*[[({]\s*(?:dot|точка)\s*[\])}]\s*/gi, '.')

const extractBalancedDiv = (html: string, classNeedle: string): string | null => {
    const needleIdx = html.indexOf(classNeedle)
    if (needleIdx === -1) return null
    const tagStart = html.lastIndexOf('<div', needleIdx)
    if (tagStart === -1) return null
    const tagEnd = html.indexOf('>', tagStart)
    if (tagEnd === -1) return null

    const divRe = /<div\b[^>]*>|<\/div\s*>/gi
    divRe.lastIndex = tagEnd + 1
    let depth = 1
    let match: RegExpExecArray | null
    while ((match = divRe.exec(html))) {
        if (match[0].charAt(1) === '/') depth--
        else depth++
        if (depth === 0) return html.slice(tagEnd + 1, match.index)
    }
    return null
}

const SANITIZE_OPTS: sanitizeHtml.IOptions = {
    allowedTags: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'blockquote', 'a', 'ul', 'ol', 'li', 'h2', 'h3', 'img'],
    allowedAttributes: {a: ['href', 'target', 'rel'], img: ['src', 'alt']},
    allowedSchemes: ['http', 'https'],
    transformTags: {
        a: sanitizeHtml.simpleTransform('a', {target: '_blank', rel: 'noopener noreferrer nofollow'}),
    },
}

export const fetchArticleBody = async (link: string): Promise<ParsedArticle | null> => {
    if (!isSusuLink(link)) return null

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    let html: string
    try {
        const res = await fetch(link, {headers: {'User-Agent': BROWSER_UA}, signal: ctrl.signal})
        if (res.status !== 200) return null
        html = await res.text()
    } catch {
        return null
    } finally {
        clearTimeout(timer)
    }

    const titleMatch = /<h1[^>]*class="page-header"[^>]*>([\s\S]*?)<\/h1>/.exec(html)
    const title = titleMatch ? deobfuscateContacts(decodeEntities(titleMatch[1]!.replace(/<[^>]+>/g, ''))) : ''
    if (!title) return null

    const imageMatch = /class="[^"]*field-name-field-image[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/.exec(html)
    const image = imageMatch?.[1]

    const rawBody = extractBalancedDiv(html, 'field-name-body')
    const contentHtml = rawBody ? deobfuscateContacts(sanitizeHtml(rawBody, SANITIZE_OPTS).trim()) : ''
    if (!contentHtml) return null

    return {title, image, contentHtml}
}
