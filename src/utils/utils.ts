export const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const getPackageName = (dep: string): string => {
    if (dep.startsWith('@')) {
        const parts = dep.split('/')
        // 确保有 scope 和 pkg name，否则返回原字符串
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return `${parts[0]}/${parts[1]}`
        }
        return dep
    }

    // split 理论上至少返回 [''], 但为了满足 TS 严格模式，兜底返回 dep
    return dep.split('/')[0] ?? dep
}
