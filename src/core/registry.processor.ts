import type { IRegistryItemFileSchema, IRegistryItemsSchema } from '#/shadcn'
import type { IComponentsRegistry } from '@/types'
import { join, relative } from 'node:path'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { getDependencies } from '@/utils/dependencies.ts'
import { getRegistryType } from '@/utils/types.ts'
import { getComponentName } from './registry.name'

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
): IRegistryItemsSchema => {
    // Find all valid files within the component directory using configurable pattern
    const filePattern = config.filePattern ?? '**/*'
    const files = globSync(`${filePattern}.{${VALID_EXTENSIONS}}`, {
        cwd: dir,
        absolute: true,
    })

    // Get the relative path from the working directory for categorization
    const relativeDir = relative(config.cwd, dir)

    // Extract component name using smart naming logic
    const name = getComponentName(dir, filesInDir)

    // Determine the registry type based on the directory structure
    const type = getRegistryType(relativeDir)

    // Build the registry entry for the current component
    const registryItem: IRegistryItemsSchema = {
        name,
        type,
        files: files.map((file) => {
            const relativeFile = relative(dir, file)
            const relativeFilePath = join(relativeDir, relativeFile)
            return {
                path: relativeFilePath,
                type: getRegistryType(relativeFilePath),
            }
        }) as IRegistryItemFileSchema[],
    }

    // Analyze and extract dependencies for the current component
    const pkgDependencies = getDependencies(dir, config.dependencies, config.devDependencies, {
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
