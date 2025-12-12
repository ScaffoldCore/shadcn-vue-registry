import type { IRegistrySchema } from '#/shadcn'
import type { ComponentEntry } from '@/core/registry.discovery.ts'
import type { ResolveConfig } from '@/types'
import { blue, red } from 'ansis'
import { loadProjectConfig } from '@/core/registry.config.ts'
import { discoverComponents } from '@/core/registry.discovery.ts'
import { getComponentName } from '@/core/registry.name.ts'
import { processComponent } from '@/core/registry.processor.ts'

/**
 * Generates a complete shadcn-vue registry schema by scanning components and dependencies.
 *
 * This function performs the following steps:
 * 1. Loads project configuration (components.json and package.json)
 * 2. Discovers component files and groups them by directory
 * 3. Processes each component to extract file information and dependencies
 * 4. Returns a complete registry schema compatible with shadcn-vue
 *
 * @param config - The resolved configuration containing project paths and settings
 * @returns Promise<IRegistrySchema> - Complete registry schema with all components and their metadata
 * @throws Error - If components.json is not found in the project
 *
 * @example
 * ```typescript
 * const config = { root: '/project', cwd: '/project/src', name: 'my-ui' }
 * const registry = await generateShadcnRegistry(config)
 * console.log(registry.items.length) // Number of components found
 * ```
 */
export const generateShadcnRegistry = async (config: ResolveConfig): Promise<IRegistrySchema> => {
    // 1. Load project configuration (components.json and package.json dependencies)
    const { componentsJson, dependencies, devDependencies } = await loadProjectConfig(config.root)

    // 2. Discover component files and group them by directory
    const { componentEntries } = discoverComponents(config)

    // Log the discovery progress for user feedback
    console.log(
        blue(`Found ${red(componentEntries.length)} components in ${config.cwd}`),
    )

    // 3. Process each component entry to build registry entries
    const registryItems = await Promise.all(
        componentEntries.map((entry: ComponentEntry) => {
            const { dir, files, isFileBased } = entry

            // For file-based components, use file path instead of directory
            const componentDir = isFileBased ? files[0]! : dir
            const name = getComponentName(dir, files, isFileBased)

            return processComponent(
                componentDir,
                files,
                {
                    cwd: config.cwd,
                    dependencies,
                    devDependencies,
                    registries: componentsJson?.registries ?? {},
                },
                name,
            )
        }),
    )

    // 4. Return the complete registry schema
    return {
        $schema: 'https://shadcn-vue.com/schema/registry.json',
        name: config.name,
        homepage: config.homepage,
        items: registryItems,
    }
}
