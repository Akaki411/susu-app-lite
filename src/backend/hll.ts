// Счётчик уникальных IP по алгоритму HyperLogLog

import {createHash} from 'node:crypto'
import {config} from './env'
import {getRedis} from './redis'

const dayKey = (date = new Date()): string => `hll:uip:${date.toISOString().slice(0, 10)}`

const hash64 = (input: string): bigint => {
    const digest = createHash('sha1').update(input).digest()
    let h = 0n
    for (let i = 0; i < 8; i++) h = (h << 8n) | BigInt(digest[i]!)
    return h
}

const P = 14
const M = 1 << P
const ALPHA = 0.7213 / (1 + 1.079 / M)

export class HyperLogLog {
    private registers: Uint8Array

    constructor(registers?: Uint8Array) {
        this.registers = registers ?? new Uint8Array(M)
    }

    add(value: string): void {
        const h = hash64(value)
        const index = Number(h >> BigInt(64 - P))
        const rest = (h << BigInt(P)) & ((1n << 64n) - 1n)
        const rank = this.leadingZeros64(rest) + 1
        if (rank > this.registers[index]!) this.registers[index] = rank
    }

    private leadingZeros64(x: bigint): number {
        if (x === 0n) return 64 - P
        let n = 0
        for (let bit = 63n; bit >= BigInt(P); bit--) {
            if ((x >> bit) & 1n) break
            n++
        }
        return n
    }

    count(): number {
        let sum = 0
        let zeros = 0
        for (let i = 0; i < M; i++) {
            sum += 2 ** -this.registers[i]!
            if (this.registers[i] === 0) zeros++
        }
        let estimate = (ALPHA * M * M) / sum
        if (estimate <= 2.5 * M && zeros > 0) {
            estimate = M * Math.log(M / zeros)
        }
        return Math.round(estimate)
    }

    serialize(): string {
        return Buffer.from(this.registers).toString('base64')
    }

    static deserialize(data: string): HyperLogLog {
        try {
            const bytes = Buffer.from(data, 'base64')
            if (bytes.length === M) return new HyperLogLog(new Uint8Array(bytes))
        } catch {
        }
        return new HyperLogLog()
    }
}

const memHll = new Map<string, HyperLogLog>()

const memAdd = (ip: string, key: string): void => {
    let h = memHll.get(key)
    if (!h) {
        h = new HyperLogLog()
        memHll.set(key, h)
    }
    h.add(ip)
}

const memCount = (key: string): number => memHll.get(key)?.count() ?? 0

export const trackUniqueIp = async (ip: string): Promise<void> => {
    if (!ip || ip === 'unknown') return
    const key = dayKey()
    try {
        if (config.isDev) {
            memAdd(ip, key)
        } else {
            const redis = await getRedis()
            await redis.pfAdd(key, ip)
        }
    } catch {
    }
}

export const countUniqueIp = async (dateStr?: string): Promise<number> => {
    const key = dateStr ? `hll:uip:${dateStr}` : dayKey()
    try {
        if (config.isDev) return memCount(key)
        const redis = await getRedis()
        return await redis.pfCount(key)
    } catch {
        return 0
    }
}
