'use client'
// Установка PWA с экрана входа. Показываем только на мобильном браузере (по UA) и только
// если приложение ещё не запущено как установленное (display-mode: standalone). Android/
// Chromium дают нативный prompt() через beforeinstallprompt; в iOS Safari этого события нет
// вообще — единственный способ поставить PWA там — вручную через «Поделиться → На экран
// «Домой»», поэтому для iOS показываем кнопку с инструкцией вместо prompt().
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isIOS = (): boolean => /iphone|ipad|ipod/i.test(navigator.userAgent)
const isMobileUA = (): boolean => /android|iphone|ipad|ipod/i.test(navigator.userAgent)
const isStandalone = (): boolean =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true

export function usePwaInstall(): { canInstall: boolean; isIOS: boolean; promptInstall: () => Promise<boolean> } {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    setMobile(isMobileUA())
    setIos(isIOS())
    setInstalled(isStandalone())

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = async (): Promise<boolean> => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    setDeferred(null)
    return outcome === 'accepted'
  }

  return {
    canInstall: mobile && !installed && (deferred != null || ios),
    isIOS: ios,
    promptInstall,
  }
}
