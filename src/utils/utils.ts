/**
 * Escapes special characters in a string for use in regular expressions.
 *
 * This function replaces all special regex characters with their escaped equivalents
 * to prevent them from being interpreted as regex metacharacters.
 *
 * @param string - The string to escape special characters from
 * @returns The escaped string safe to use in regular expression patterns
 *
 * @example
 * ```typescript
 * escapeRegExp('test.file.js') // returns 'test\\.file\\.js'
 * escapeRegExp('hello(world)') // returns 'hello\\(world\\)'
 * ```
 */
export const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extracts the package name from a dependency string, handling both scoped and non-scoped packages.
 *
 * For scoped packages (starting with '@'), it returns the full scope/package-name combination.
 * For regular packages, it returns the name before any version specifiers or paths.
 *
 * @param dep - The dependency string to parse (e.g., '@vue/runtime-core', 'lodash', 'react@18.0.0')
 * @returns The normalized package name without version specifiers or subpaths
 *
 * @example
 * ```typescript
 * getPackageName('@vue/runtime-core') // returns '@vue/runtime-core'
 * getPackageName('lodash/es') // returns 'lodash'
 * getPackageName('react@18.0.0') // returns 'react'
 * getPackageName('@invalid/scope') // returns '@invalid/scope'
 * ```
 */
export const getPackageName = (dep: string): string => {
    if (dep.startsWith('@')) {
        const parts = dep.split('/')
        // Ensure we have both scope and package name, otherwise return original string
        if (parts.length >= 2 && parts[0] && parts[1]) {
            return `${parts[0]}/${parts[1]}`
        }
        return dep
    }

    // Split should theoretically return at least [''], but fallback to dep for TS strict mode
    return dep.split('/')[0] ?? dep
}
