'use client'
// Группировка предметов БРС по категории формы контроля

import type { RatingSubject } from '@/shared/types'

export type RatingCategory = 'coursework' | 'exam' | 'diffCredit' | 'credit' | 'other'

const CATEGORY_ORDER: RatingCategory[] = ['coursework', 'exam', 'diffCredit', 'credit', 'other']

const categoryOf = (controlType: string): RatingCategory => {
  const t = controlType.toLowerCase()
  if (t.includes('курсов')) return 'coursework'
  if (t.includes('дифферен')) return 'diffCredit'
  if (t.includes('экзамен')) return 'exam'
  if (t.includes('зачет') || t.includes('зачёт')) return 'credit'
  return 'other'
}

export const groupRatingByCategory = (
  subjects: RatingSubject[],
): Array<{ category: RatingCategory; items: RatingSubject[] }> => {
  const buckets = new Map<RatingCategory, RatingSubject[]>(CATEGORY_ORDER.map((c) => [c, []]))
  for (const s of subjects) buckets.get(categoryOf(s.controlType))!.push(s)
  return CATEGORY_ORDER.map((category) => ({ category, items: buckets.get(category)! })).filter(
    (g) => g.items.length > 0,
  )
}

const GRADED_LIKE_EXAM: RatingCategory[] = ['coursework', 'exam', 'diffCredit']

export type RatingStatusKey = 'fail' | 'satisfactory' | 'good' | 'excellent' | 'creditFail' | 'creditPass'

const STATUS_COLOR: Record<RatingStatusKey, string> = {
  fail: 'var(--c-rate-low)',
  satisfactory: 'var(--c-rate-satisfactory)',
  good: 'var(--c-rate-mid)',
  excellent: 'var(--c-rate-high)',
  creditFail: 'var(--c-rate-low)',
  creditPass: 'var(--c-rate-high)',
}

const MARK_STATUS: Record<string, RatingStatusKey> = {
  'зачтено': 'creditPass',
  'не зачтено': 'creditFail',
  'незачтено': 'creditFail',
  '5': 'excellent',
  '4': 'good',
  '3': 'satisfactory',
  '2': 'fail',
}

const statusFromMark = (mark: string | undefined): RatingStatusKey | null => {
  if (!mark) return null
  return MARK_STATUS[mark.trim().toLowerCase()] ?? null
}

export const statusFor = (subject: RatingSubject): { color: string; statusKey: RatingStatusKey | null } => {
  const fromMark = statusFromMark(subject.mark)
  if (fromMark) return { color: STATUS_COLOR[fromMark], statusKey: fromMark }

  const pct = subject.rating
  if (pct <= 0) return { color: 'var(--c-text-3)', statusKey: null }

  if (GRADED_LIKE_EXAM.includes(categoryOf(subject.controlType))) {
    if (pct < 60) return { color: STATUS_COLOR.fail, statusKey: 'fail' }
    if (pct < 75) return { color: STATUS_COLOR.satisfactory, statusKey: 'satisfactory' }
    if (pct < 85) return { color: STATUS_COLOR.good, statusKey: 'good' }
    return { color: STATUS_COLOR.excellent, statusKey: 'excellent' }
  }

  if (pct < 60) return { color: STATUS_COLOR.creditFail, statusKey: 'creditFail' }
  return { color: STATUS_COLOR.creditPass, statusKey: 'creditPass' }
}

export const colorForPercent = (pct: number): string => {
  if (pct <= 0) return 'var(--c-text-3)'
  if (pct < 60) return 'var(--c-rate-low)'
  if (pct < 75) return 'var(--c-rate-satisfactory)'
  if (pct < 85) return 'var(--c-rate-mid)'
  return 'var(--c-rate-high)'
}
