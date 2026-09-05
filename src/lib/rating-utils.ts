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

export const statusFor = (subject: RatingSubject): { color: string; statusKey: RatingStatusKey | null } => {
  const pct = subject.rating
  if (pct <= 0) return { color: 'var(--c-text-3)', statusKey: null }

  if (GRADED_LIKE_EXAM.includes(categoryOf(subject.controlType))) {
    if (pct < 60) return { color: 'var(--c-rate-low)', statusKey: 'fail' }
    if (pct < 75) return { color: 'var(--c-rate-satisfactory)', statusKey: 'satisfactory' }
    if (pct < 85) return { color: 'var(--c-rate-mid)', statusKey: 'good' }
    return { color: 'var(--c-rate-high)', statusKey: 'excellent' }
  }

  if (pct < 60) return { color: 'var(--c-rate-low)', statusKey: 'creditFail' }
  return { color: 'var(--c-rate-high)', statusKey: 'creditPass' }
}

export const colorForPercent = (pct: number): string => {
  if (pct <= 0) return 'var(--c-text-3)'
  if (pct < 60) return 'var(--c-rate-low)'
  if (pct < 75) return 'var(--c-rate-satisfactory)'
  if (pct < 85) return 'var(--c-rate-mid)'
  return 'var(--c-rate-high)'
}
