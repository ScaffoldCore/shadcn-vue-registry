import type { ResolveConfig } from '@/types'
import { dirname } from 'node:path'
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
export const discoverComponents = (config: ComponentScanConfig) => {
    // Get scan patterns from configuration or use defaults
    const componentPattern = config.scanPatterns?.componentPattern ?? '*/*/*'

    // Scan for component files using configurable glob pattern
    const componentFiles = globSync(`${componentPattern}.{${VALID_EXTENSIONS}}`, {
        cwd: config.cwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'], // Exclude common build/dependency directories
    })

    // Group files by their directory to identify component directories
    const dirToFilesMap = new Map<string, string[]>()
    for (const file of componentFiles) {
        const dir = dirname(file)
        if (!dirToFilesMap.has(dir)) {
            dirToFilesMap.set(dir, [])
        }
        dirToFilesMap.get(dir)!.push(file)
    }

    // Extract all component directories
    const dirs = Array.from(dirToFilesMap.keys())

    // Remove duplicate directories to ensure each component is processed once
    const uniqueDirs = Array.from(new Set(dirs))

    return {
        componentFiles,
        dirToFilesMap,
        uniqueDirs,
    }
}

/**
 * Type definition for component discovery result
 */
export type ComponentDiscoveryResult = ReturnType<typeof discoverComponents>
