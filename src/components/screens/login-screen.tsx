'use client'
// Экран входа
//
// Успешный вход сохраняет токены и профиль в localStorage и уводит на расписание

import {useState} from 'react'
import {LanguageSheet} from '@/components/common/language-sheet.tsx'
import {Icon} from '@/components/common/icons'
import {InstallPwaButton} from '@/components/login/install-pwa-button.tsx'
import {useI18n} from '@/i18n'
import {login} from '@/lib/api-client'
import {navigate} from '@/lib/router'
import {saveProfile, saveTokens} from '@/lib/token-store'

export default () => {
    const {t} = useI18n()
    const [loginName, setLoginName] = useState('')
    const [password, setPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [langOpen, setLangOpen] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!loginName || !password || submitting) return
        setSubmitting(true)
        setError(null)
        const res = await login(loginName.trim(), password)
        setSubmitting(false)
        if (res.ok && res.tokens && res.profile) {
            saveTokens(res.tokens)
            saveProfile(res.profile)
            navigate('/schedule', {replace: true})
            return
        }
        setError(res.message === 'network' ? t('login.errorNetwork') : t('login.errorInvalid'))
    }

    return (
        <div className="login">
            <div className="login__panel">
                <div className="login__hero">
                    <button
                        type="button"
                        onClick={() => setLangOpen(true)}
                        aria-label={t('settings.language')}
                        className="login__lang-btn"
                    >
                        <Icon name="world" className="login__lang-icon"/>
                    </button>
                    <img src="/logo.webp" alt="ЮУрГУ" className="login__logo"/>
                </div>

                <form onSubmit={onSubmit} className="login__form">
                    <h1 className="login__title">{t('login.title')}</h1>

                    <label className="login__field">
                        <span className="login__field-label">{t('login.login')}</span>
                        <input
                            className="login__input"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            placeholder={t('login.loginPlaceholder')}
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                        />
                    </label>

                    <label className="login__field">
                        <span className="login__field-label">{t('login.password')}</span>
                        <input
                            type="password"
                            className="login__input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="current-password"
                        />
                    </label>

                    {error && <p className="login__error">{error}</p>}

                    <button type="submit" disabled={submitting} className="login__submit">
                        {submitting ? t('login.submitting') : t('login.submit')}
                    </button>

                    <InstallPwaButton/>

                    <p className="login__disclaimer">{t('login.unofficialNotice')}</p>
                    <p className="login__links">
                        <a
                            href="https://github.com/Akaki411/susu-app-lite"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="login__link"
                        >
                            {t('login.sourceCode')}
                        </a>
                        <span className="login__links-dot" aria-hidden="true">·</span>
                        <a
                            href="https://t.me/akaki411"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="login__link"
                        >
                            {t('login.author')}: @akaki411
                        </a>
                    </p>
                </form>
            </div>
            <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)}/>
        </div>
    )
}
