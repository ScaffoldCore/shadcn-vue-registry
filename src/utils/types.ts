import { sep } from 'node:path'
import { typeMap } from '@/constant/typeMap.ts'

export const getRegistryType = (path: string): string => {
    const segments = path.split(sep)

    // 从后往前找，命中第一个就返回（也就是“最后一个出现的 key”）
    for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i] as string
        if (segment in typeMap) {
            return typeMap[segment] as string
        }
    }

    // 兜底逻辑：仍然使用第一个目录
    const fallback = segments[0] as string
    return typeMap[fallback] ?? `registry:${fallback}`
}
