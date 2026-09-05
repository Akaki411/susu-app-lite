'use client'

import type { AuthTokens, StudentProfile } from '@/shared/types'

const KEY = {
  access: 'susu_app_token',
  refresh: 'refreshToken',
  identity: 'identityToken',
  profile: 'susu_profile',
  theme: 'susu_theme',
  settings: 'susu_settings',
} as const

const hasStorage = (): boolean => typeof window !== 'undefined' && !!window.localStorage;

const read = (key: string): string | null => {
  if (!hasStorage()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
};

const write = (key: string, value: string): void => {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {}
};

const remove = (key: string): void => {
  if (!hasStorage()) return
  try {
    window.localStorage.removeItem(key)
  } catch {}
};

const generateIdentity = (len = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  const rnd =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint32Array(len)))
      : Array.from({ length: len }, () => Math.floor(Math.random() * 1e9))
  for (let i = 0; i < len; i++) s += chars.charAt(rnd[i]! % chars.length)
  return s
};

export const getIdentity = (): string => {
  let id = read(KEY.identity)
  if (!id) {
    id = generateIdentity()
    write(KEY.identity, id)
  }
  return id
};

export const getAccessToken = (): string | null => read(KEY.access);

export const getRefreshToken = (): string | null => read(KEY.refresh);

export const saveTokens = (tokens: Pick<AuthTokens, 'accessToken' | 'refreshToken'>): void => {
  write(KEY.access, tokens.accessToken)
  write(KEY.refresh, tokens.refreshToken)
};

export const getProfile = (): StudentProfile | null => {
  const raw = read(KEY.profile)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StudentProfile
  } catch {
    return null
  }
};

export const saveProfile = (profile: StudentProfile): void => {
  write(KEY.profile, JSON.stringify(profile))
};

export const isAuthenticated = (): boolean => !!getAccessToken() && !!getProfile();

export const clearSession = (): void => {
  remove(KEY.access)
  remove(KEY.refresh)
  remove(KEY.profile)
};

export const storageKeys = KEY
export { read as readRaw, write as writeRaw }
