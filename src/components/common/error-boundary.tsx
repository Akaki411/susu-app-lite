'use client'
// Общий улавливатель ошибок для контента экранов. Изредка при загрузке клиентского чанка
// React рендерит компонент до того, как диспетчер хуков готов, этот компонент перезагружает рендер

import {Component, type ReactNode} from 'react'
import {t} from '@/i18n'

interface Props {
    children: ReactNode
    resetKey: unknown
}

interface State {
    hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = {hasError: false}
    private retried = false

    static getDerivedStateFromError(): State {
        return {hasError: true}
    }

    componentDidCatch(error: unknown): void {
        console.error('[ErrorBoundary]', error)
        if (this.retried) return
        this.retried = true
        requestAnimationFrame(() => this.setState({hasError: false}))
    }

    componentDidUpdate(prevProps: Props): void {
        if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
            this.retried = false
            this.setState({hasError: false})
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="empty-state">
                    {t('common.error')}
                    <button
                        type="button"
                        className="error-fallback__retry"
                        onClick={() => window.location.reload()}
                    >
                        {t('common.retry')}
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
