'use client'
// Клиентский редирект на нужную страницу

import {useEffect} from 'react'
import {navigate} from '@/lib/router'

export default ({to}: { to: string }) => {
    useEffect(() => {
        navigate(to, {replace: true})
    }, [to])
    return null
}
