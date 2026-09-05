'use client'
// Пульсирующая точка рядом с типом пары

import {memo} from 'react'

const LiveDotBase = () => <span aria-hidden="true" className="live-dot"/>;

export const LiveDot = memo(LiveDotBase)
