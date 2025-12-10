import type { IRegistryItemFileSchema, IRegistryItemsSchema, IRegistrySchema } from '#/shadcn'
import type { IComponentsRegistry, ResolveConfig } from '@/types'
import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { blue, red } from 'ansis'
import { findUp } from 'find-up'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { getDependencies } from '@/utils/dependencies.ts'
import { getRegistryType } from '@/utils/types.ts'

/**
 * Generates a complete shadcn-vue registry schema by scanning components and dependencies.
 *
 * This function performs the following steps:
 * 1. Locates and reads the components.json configuration file
 * 2. Extracts dependency information from package.json
 * 3. Scans for component directories using glob patterns
 * 4. Processes each component to extract file information and dependencies
 * 5. Returns a complete registry schema compatible with shadcn-vue
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
    // Locate the components.json configuration file by searching up from the working directory
    const componentsPath = await findUp('components.json', {
        cwd: config.root,
    })

    // Validate that components.json exists - it's required for shadcn-vue projects
    if (!componentsPath) {
        throw new Error('components.json not found, skipping component discovery.')
    }

    // Parse the components.json to extract registry configurations
    const componentsJson = JSON.parse(await readFile(componentsPath, 'utf-8')) as {
        registries?: IComponentsRegistry
    }

    // Path to the package.json file for dependency extraction
    const packageJsonPath = join(config.root, 'package.json')

    // Initialize arrays to store project dependencies
    let dependencies: string[] = []
    let devDependencies: string[] = []

    // Extract dependency information from package.json if it exists
    if (fs.existsSync(packageJsonPath)) {
        try {
            // Parse package.json to extract both production and development dependencies
            const pkg = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
            dependencies = Object.keys(pkg.dependencies || {})
            devDependencies = Object.keys(pkg.devDependencies || {})
        }
        catch (e) {
            console.warn('Failed to read package.json, dependency classification may be incomplete.')
        }
    }

    // Scan for component files using glob pattern matching shadcn-vue structure
    // Pattern: */*/*.{vue,js,jsx,ts,tsx} matches the typical shadcn-vue component structure (category/component/files)
    const dirs = globSync(`*/*/*.{${VALID_EXTENSIONS}}`, {
        cwd: config.cwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'], // Exclude common build/dependency directories
    }).map(file => dirname(file)) // Extract directory paths from file paths

    // Remove duplicate directories to ensure each component is processed once
    const uniqueDirs = Array.from(new Set(dirs))

    // Log the discovery progress for user feedback
    console.log(
        blue(`Found ${red(uniqueDirs.length)} components in ${config.cwd}`),
    )

    // Initialize array to store all processed component registry items
    const registryItems: IRegistryItemsSchema[] = []

    // Process each unique component directory to build registry entries
    for (const dir of uniqueDirs) {
        // Find all valid files within the component directory
        const files = globSync(`**/*.{${VALID_EXTENSIONS}}`, {
            cwd: dir,
            absolute: true,
        })

        // Get the relative path from the working directory for categorization
        const relativeDir = relative(config.cwd, dir)

        // Extract component name (last path segment)
        const name = relativeDir.split(sep).pop()!

        // Determine the registry type based on the directory structure
        const type = getRegistryType(relativeDir)

        // Debug logging (commented out for production use)
        // console.log(`Type: ${type}`)
        // console.log(`Directory: ${relativeDir}, Category: ${category}`)
        // console.log(`Files:`, files.map(f => relative(dir, f)))

        // Build the registry entry for the current component
        const registryFiles: IRegistryItemsSchema = {
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
        const pkgDependencies = getDependencies(dir, dependencies, devDependencies, {
            registries: componentsJson?.registries ?? {},
        })

        // Attach production dependencies if any are found
        if (pkgDependencies.dependencies.length) {
            Object.assign(registryFiles, {
                dependencies: pkgDependencies.dependencies,
            })
        }

        // Attach development dependencies if any are found
        if (pkgDependencies.devDependencies.length) {
            Object.assign(registryFiles, {
                devDependencies: pkgDependencies.devDependencies,
            })
        }

        // Attach registry dependencies (other components this depends on) if any are found
        if (pkgDependencies.registryDependencies.length) {
            Object.assign(registryFiles, {
                registryDependencies: pkgDependencies.registryDependencies,
            })
        }

        // Add the completed registry item to the items list
        registryItems.push(registryFiles)

        // Debug logging for dependencies (commented out for production use)
        // console.log(`Dependencies: `, getDependencies(dir));
    }

    return {
        $schema: 'https://shadcn-vue.com/schema/registry.json',
        name: config.name,
        homepage: config.homepage,
        items: registryItems,
    }
}
