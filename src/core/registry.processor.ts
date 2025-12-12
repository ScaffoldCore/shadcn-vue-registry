import type { IRegistryItemFileSchema, IRegistryItemsSchema } from '#/shadcn'
import type { IComponentsRegistry } from '@/types'
import { dirname, join, relative } from 'node:path'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman'
import { getComponentName } from '@/core/registry.name'
import { getDependencies } from '@/utils/dependencies'
import { getRegistryType } from '@/utils/types'

/**
 * Configuration for processing individual components
 */
export interface ProcessComponentConfig {
    /** Working directory for relative path calculations */
    cwd: string
    /** File scanning pattern (default: glob pattern) */
    filePattern?: string | string[]
    /** Project dependencies */
    dependencies: string[]
    /** Development dependencies */
    devDependencies: string[]
    /** Components registry configuration */
    registries: IComponentsRegistry
}

/**
 * Processes a single component directory to generate a registry entry
 *
 * @param dir - The directory containing the component
 * @param filesInDir - Array of files found in the component directory
 * @param config - Configuration for component processing
 * @returns Complete registry item schema for the component
 *
 * @example
 * ```typescript
 * const registryItem = processComponent(
 *   '/project/src/ui/button',
 *   ['/project/src/ui/button/index.vue'],
 *   {
 *     cwd: '/project/src',
 *     dependencies: ['vue'],
 *     devDependencies: ['vite'],
 *     registries: {}
 *   }
 * )
 * ```
 */
export const processComponent = (
    dir: string,
    filesInDir: string[],
    config: ProcessComponentConfig,
    precomputedName?: string,
): IRegistryItemsSchema => {
    // For file-based components, the dir is actually the file path
    // Extract the actual directory for path calculations
    const isFileBased = filesInDir.length === 1 && filesInDir[0] === dir
    const actualDir = isFileBased ? dirname(dir) : dir

    // For file-based components, use only the provided files
    // For directory-based components, scan for all files
    const files = isFileBased
        ? filesInDir
        : globSync(`${(config.filePattern ?? '**/*')}.{${VALID_EXTENSIONS}}`, {
                cwd: actualDir,
                absolute: true,
            })

    // Get the relative path from the working directory for categorization
    const relativeDir = relative(config.cwd, actualDir)

    // Use precomputed name if provided, otherwise extract component name using smart naming logic
    const name = precomputedName || getComponentName(dir, filesInDir)

    // Determine the registry type based on the directory structure
    const type = getRegistryType(relativeDir)

    // Build the registry entry for the current component
    const registryItem: IRegistryItemsSchema = {
        name,
        type,
        files: files.map((file) => {
            const relativeFile = relative(actualDir, file)
            const relativeFilePath = join(relativeDir, relativeFile)
            return {
                path: relativeFilePath,
                type: getRegistryType(relativeFilePath),
            }
        }) as IRegistryItemFileSchema[],
    }

    // Analyze and extract dependencies for the current component
    const pkgDependencies = getDependencies(actualDir, config.dependencies, config.devDependencies, {
        registries: config.registries,
    })

    // Attach production dependencies if any are found
    if (pkgDependencies.dependencies.length) {
        Object.assign(registryItem, {
            dependencies: pkgDependencies.dependencies,
        })
    }

    // Attach development dependencies if any are found
    if (pkgDependencies.devDependencies.length) {
        Object.assign(registryItem, {
            devDependencies: pkgDependencies.devDependencies,
        })
    }

    // Attach registry dependencies (other components this depends on) if any are found
    if (pkgDependencies.registryDependencies.length) {
        Object.assign(registryItem, {
            registryDependencies: pkgDependencies.registryDependencies,
        })
    }

    return registryItem
}
