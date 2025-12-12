import type { IComponentsRegistry, ResolveConfig } from '@/types'
import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { findUp } from 'find-up'

/**
 * Loads project configuration including components.json and package.json dependencies
 * Merges manual dependencies from config with package.json dependencies
 *
 * @param root - The root directory of the project
 * @param config - Additional configuration with manual dependencies
 * @returns Promise containing components registry and dependency information
 *
 * @example
 * ```typescript
 * const { componentsJson, dependencies, devDependencies } = await loadProjectConfig('/project', {
 *   dependencies: ['vue', 'element-plus'],
 *   devDependencies: ['vite', 'typescript']
 * })
 * ```
 */
export const loadProjectConfig = async (root: string, config?: Pick<ResolveConfig, 'dependencies' | 'devDependencies'>) => {
    // Locate the components.json configuration file by searching up from the working directory
    const componentsPath = await findUp('components.json', {
        cwd: root,
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
    const packageJsonPath = join(root, 'package.json')

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

    // Merge with manual dependencies from config (if provided)
    // Manual dependencies take priority and are merged with package.json dependencies
    const mergedDependencies = config?.dependencies
        ? Array.from(new Set([...config.dependencies, ...dependencies]))
        : dependencies

    const mergedDevDependencies = config?.devDependencies
        ? Array.from(new Set([...config.devDependencies, ...devDependencies]))
        : devDependencies

    return {
        componentsJson,
        dependencies: mergedDependencies,
        devDependencies: mergedDevDependencies,
    }
}

/**
 * Type definition for project configuration
 */
export type ProjectConfig = Awaited<ReturnType<typeof loadProjectConfig>>
