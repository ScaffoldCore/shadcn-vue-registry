import type { ResolveConfig } from '@/types'
import { basename, dirname } from 'node:path'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'

/**
 * Configuration for component scanning
 */
export interface ComponentScanConfig extends Pick<ResolveConfig, 'cwd' | 'scanPatterns'> {}

/**
 * Discovers component files and groups them by directory
 *
 * @param config - Configuration containing scan patterns and working directory
 * @returns Object containing discovered component files and directory mappings
 */
/**
 * Determines if files in a directory should be treated as separate components
 * rather than a single multi-file component
 */
const shouldSplitIntoSeparateComponents = (files: string[]): boolean => {
    // Always split if there are no index files
    const hasIndexFile = files.some(file => basename(file).startsWith('index.'))
    if (!hasIndexFile) {
        return true
    }

    return false
}

export const discoverComponents = (config: ComponentScanConfig) => {
    // Get scan patterns from configuration or use defaults
    const componentPattern = config.scanPatterns?.componentPattern ?? '*/*/*'

    // Scan for component files using configurable glob pattern
    const componentFiles = globSync(`${componentPattern}.{${VALID_EXTENSIONS}}`, {
        cwd: config.cwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'], // Exclude common build/dependency directories
    })

    // Group files by their directory first
    const dirToFilesMap = new Map<string, string[]>()
    for (const file of componentFiles) {
        const dir = dirname(file)
        if (!dirToFilesMap.has(dir)) {
            dirToFilesMap.set(dir, [])
        }
        dirToFilesMap.get(dir)!.push(file)
    }

    // Convert to a structure that supports both directory-based and file-based components
    const componentEntries: Array<{
        dir: string
        files: string[]
        isFileBased: boolean
    }> = []

    for (const [dir, files] of dirToFilesMap) {
        if (shouldSplitIntoSeparateComponents(files)) {
            // Treat each file as a separate component
            for (const file of files) {
                componentEntries.push({
                    dir,
                    files: [file], // Only this file for this component
                    isFileBased: true,
                })
            }
        }
        else {
            // Treat all files in directory as one component
            componentEntries.push({
                dir,
                files,
                isFileBased: false,
            })
        }
    }

    // Create a map that properly separates file-based components
    const finalDirToFilesMap = new Map<string, string[]>()
    const uniqueDirs: string[] = []

    for (const entry of componentEntries) {
        // For file-based components, use the file itself as the "directory" key
        // and only include that specific file
        if (entry.isFileBased) {
            const key = entry.files[0]!
            finalDirToFilesMap.set(key, entry.files)
            uniqueDirs.push(key)
        }
        else {
            finalDirToFilesMap.set(entry.dir, entry.files)
            uniqueDirs.push(entry.dir)
        }
    }

    return {
        componentFiles,
        dirToFilesMap: finalDirToFilesMap,
        uniqueDirs,
        componentEntries,
    }
}

/**
 * Component entry information
 */
export interface ComponentEntry {
    /** Directory containing the component files */
    dir: string
    /** Files in the component */
    files: string[]
    /** Whether this is a file-based component (true) or directory-based (false) */
    isFileBased: boolean
}

/**
 * Type definition for component discovery result
 */
export type ComponentDiscoveryResult = ReturnType<typeof discoverComponents>
