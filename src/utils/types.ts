import { sep } from 'node:path'
import { typeMap } from '@/constant/typeMap.ts'

/**
 * Determines the registry type for a given file path by analyzing path segments.
 *
 * This function identifies the appropriate registry type by searching the path segments
 * from right to left (end to beginning) and returning the first matching type from the typeMap.
 * This approach ensures that more specific path segments take precedence over general ones.
 *
 * The search strategy works as follows:
 * 1. Split the path into segments using the platform-specific separator
 * 2. Iterate from the last segment to the first (right-to-left)
 * 3. Return the first matching type found in typeMap
 * 4. If no match is found, fall back to using the first segment
 *
 * @param path - File path relative to the registry root (e.g., 'ui/button/index.vue')
 * @returns Registry type string that corresponds to the file's category in the registry
 *
 * @example
 * ```typescript
 * // Assuming typeMap = { 'ui': 'component:ui', 'lib': 'component:lib' }
 * getRegistryType('ui/button/index.vue')    // returns 'component:ui'
 * getRegistryType('lib/utils/formats.ts')   // returns 'component:lib'
 * getRegistryType('forms/input/index.vue')  // returns 'registry:forms' (fallback)
 * ```
 *
 * @example
 * ```typescript
 * // With nested path where multiple segments match typeMap
 * // Assuming typeMap = { 'ui': 'component:ui', 'button': 'component:button' }
 * getRegistryType('ui/button/index.vue')
 * // Returns 'component:button' because 'button' is found first when searching right-to-left
 * ```
 */
export const getRegistryType = (path: string): string => {
    const segments = path.split(sep)

    // Search from right to left to find the first matching key
    // This ensures more specific segments take precedence over general ones
    // (returns the "last occurring key" that matches)
    for (let i = segments.length - 1; i >= 0; i--) {
        const segment = segments[i] as string
        if (segment in typeMap) {
            return typeMap[segment] as string
        }
    }

    // Fallback logic: use the first directory segment if no matches found
    const fallback = segments[0] as string
    return typeMap[fallback] ?? `registry:${fallback}`
}
