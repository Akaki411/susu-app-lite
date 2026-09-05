'use client'

import {useEffect, useState} from 'react'

export const useNow = (): Date => {
    const [now, setNow] = useState(() => new Date())
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 60_000)
        return () => clearInterval(id)
    }, [])
    return now
};
