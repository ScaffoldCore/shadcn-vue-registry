import { basename } from 'node:path'

/**
 * Smart component name detection based on file structure
 * This logic works regardless of pattern arrays and handles both single-file and directory components
 *
 * @param dir - The directory path containing the component files
 * @param filesInDir - Array of file paths in the directory
 * @returns The detected component name
 *
 * @example
 * ```typescript
 * // Single file composable
 * getComponentName('/app/composable', ['/app/composable/createContext.ts'])
 * // Returns: 'createContext'
 *
 * // Standard Vue component with index.vue
 * getComponentName('/app/ui/button', ['/app/ui/button/index.vue'])
 * // Returns: 'button'
 *
 * // Deep nested component
 * getComponentName('/app/ui/block/OpenV0Link', ['/app/ui/block/OpenV0Link/index.vue'])
 * // Returns: 'OpenV0Link'
 * ```
 */
export const getComponentName = (dir: string, filesInDir: string[]): string => {
    if (filesInDir.length === 0) {
        return basename(dir)
    }

    // Check if there's an index file (index.vue, index.ts, etc.)
    const hasIndexFile = filesInDir.some((file) => {
        const fileName = basename(file)
        return fileName.startsWith('index.')
    })

    if (hasIndexFile) {
        // Has index file - use directory name (standard Vue component structure)
        return basename(dir)
    }

    // Single file scenario
    if (filesInDir.length === 1) {
        const singleFile = filesInDir[0]
        if (!singleFile) {
            return basename(dir)
        }
        const fileName = basename(singleFile)
        const nameWithoutExt = fileName.includes('.')
            ? fileName.slice(0, fileName.lastIndexOf('.'))
            : fileName

        // If filename differs from directory name and looks meaningful, use filename
        const dirName = basename(dir)
        if (nameWithoutExt !== dirName && nameWithoutExt.length > 2) {
            // Prefer directory name for consistency, unless filename is clearly the intended component name
            // For cases like modal/Modal.vue, use 'modal' for consistency
            if (nameWithoutExt.toLowerCase() === dirName.toLowerCase()) {
                return dirName
            }
            return nameWithoutExt
        }

        return dirName
    }

    // Multiple files with no index - use directory name
    return basename(dir)
}

/**
 * Type definition for component name resolution function
 */
export type GetComponentNameFn = typeof getComponentName
