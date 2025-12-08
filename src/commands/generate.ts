import type { IComponentsRegistry, ResolveConfig } from '@/types'
import fs from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { blue, red } from 'ansis'
import { findUp } from 'find-up'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { getDependencies } from '@/utils/dependencies.ts'
import { getRegistryType } from '@/utils/types.ts'

/**
 * Generates a comprehensive shadcn-vue registry.json file from project structure.
 *
 * This function performs a complete analysis of the project to create a registry file
 * that can be used with shadcn-vue's component installation system.
 *
 * Key features:
 * - Scans for components in typical shadcn-vue directory structure
 * - Analyzes dependencies (production, development, and registry)
 * - Categorizes components based on directory structure
 * - Generates compliant registry.json with proper schema
 *
 * @param config - Configuration object containing paths and metadata
 * @param config.cwd - Directory to scan for components (inpath from CLI resolution)
 * @param config.root - Project root directory for package.json access
 * @param config.output - Output directory for registry.json
 * @param config.name - Project name for registry metadata
 * @param config.homepage - Project homepage for registry metadata
 *
 * @throws {Error} When the specified directory doesn't exist
 *
 * @example
 * ```typescript
 * await generateRegistry({
 *   cwd: './components',
 *   root: '/project/root',
 *   output: './registry',
 *   name: 'My UI Components',
 *   homepage: 'https://myui.com'
 * })
 * ```
 *
 * @performance
 * - Uses efficient glob patterns for file discovery
 * - Implements Set-based deduplication to avoid redundant processing
 * - Processes dependencies in bulk for better performance
 *
 * @output
 * Creates a registry.json file with shadcn-vue compatible structure:
 * ```json
 * {
 *   "$schema": "https://shadcn-vue.com/schema/registry.json",
 *   "name": "Project Name",
 *   "homepage": "https://project.com",
 *   "items": [
 *     {
 *       "name": "button",
 *       "type": "registry:ui",
 *       "items": [
 *         {
 *           "path": "ui/button/index.vue",
 *           "type": "registry:ui"
 *         }
 *       ],
 *       "dependencies": ["vue", "@vue/runtime-core"]
 *     }
 *   ]
 * }
 * ```
 */
export async function generateRegistry(config: ResolveConfig): Promise<void> {
    // Construct the output path for the generated registry.json file
    const registryJsonPath = join(config.output, 'registry.json')

    // Display scanning information to the user
    console.log(blue('🔍 Scanning project for components...'))
    console.log(`Scanning directory: ${config.cwd}`)

    // Validate that the source directory exists before proceeding
    if (!fs.existsSync(config.cwd)) {
        throw new Error(`Directory not found: ${config.cwd}`)
    }

    const componentsPath = await findUp('components.json', {
        cwd: config.cwd,
    })

    if (!componentsPath) {
        throw new Error('components.json not found, skipping component discovery.')
    }

    const componentsJson = JSON.parse(await readFile(componentsPath, 'utf-8')) as {
        registries?: IComponentsRegistry
    }

    /**
     * Step 1: Extract project dependencies from package.json
     * This is used to classify component dependencies as production, development, or registry dependencies
     */
    const packageJsonPath = join(config.root, 'package.json')

    let dependencies: string[] = []
    let devDependencies: string[] = []

    if (fs.existsSync(packageJsonPath)) {
        try {
            // Parse package.json to extract dependency information
            const pkg = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
            dependencies = Object.keys(pkg.dependencies || {})
            devDependencies = Object.keys(pkg.devDependencies || {})
        }
        catch (e) {
            console.warn('Failed to read package.json, dependency classification may be incomplete.')
        }
    }

    // Step 2: Discover component directories using glob patterns
    // Pattern: */*/*.{vue,js,jsx,ts,tsx} matches the typical shadcn-vue structure
    const dirs = globSync(`*/*/*.{${VALID_EXTENSIONS}}`, {
        cwd: config.cwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'], // Exclude common build/dependency directories
    }).map(file => dirname(file)) // Extract directory paths from file paths

    /**
     * Step 3: Remove duplicate directories
     * Multiple files in the same directory would create duplicate entries
     * Using Set ensures each component directory is processed only once
     */
    const uniqueDirs = Array.from(new Set(dirs))
    console.log(
        blue(`Found ${red(uniqueDirs.length)} components in ${config.cwd}`),
    )

    const registryItems = []
    // Process each unique component directory
    for (const dir of uniqueDirs) {
        // Scan for all valid files in the current component directory
        // This ensures we capture all related files for the component
        const files = globSync(`**/*.{${VALID_EXTENSIONS}}`, {
            cwd: dir,
            absolute: true,
        })

        // Calculate relative path from the scanned directory to current component
        const relativeDir = relative(config.cwd, dir)

        // Extract component metadata from directory structure
        // Category: first segment (e.g., 'ui', 'forms', 'layout')
        const category = relativeDir.split(sep).shift() as string
        // Name: last segment (component name)
        const name = relativeDir.split(sep).pop()!

        // Determine the registry type based on file path and content
        const type: string = getRegistryType(relativeDir)

        // console.log(`Type: ${type}`)
        //
        // console.log(`Directory: ${relativeDir}, Category: ${category}`)
        // console.log(`Files:`, files.map(f => relative(dir, f)))

        // Build the registry item structure
        const items = {
            name,
            type,
            items: files.map((file) => {
                const relativeFile = relative(dir, file)
                const relativeFilePath = join(relativeDir, relativeFile)
                return {
                    path: relativeFilePath,
                    type: getRegistryType(relativeFilePath),
                }
            }),
        }

        /**
         * Step 6: Analyze dependencies for the component
         * This categorizes imports as production, development, or registry dependencies
         */
        const pkgDependencies = getDependencies(dir, dependencies, devDependencies, {
            thirdParty: componentsJson?.registries ?? {},
        })

        /**
         * Step 7: Attach categorized dependencies to the registry item
         * Only include dependency arrays if they contain actual dependencies
         */
        if (pkgDependencies.dependencies.length) {
            Object.assign(items, {
                dependencies: pkgDependencies.dependencies,
            })
        }
        if (pkgDependencies.devDependencies.length) {
            Object.assign(items, {
                dependencies: pkgDependencies.devDependencies,
            })
        }
        if (pkgDependencies.registryDependencies.length) {
            Object.assign(items, {
                dependencies: pkgDependencies.registryDependencies,
            })
        }

        // Add the completed registry item to the items list
        registryItems.push(items)
        // console.log(`Dependencies: `, getDependencies(dir));
    }

    /**
     * Step 8: Build the final registry data structure
     * This creates the shadcn-vue compliant registry format
     */
    const registryData = {
        $schema: 'https://shadcn-vue.com/schema/registry.json', // Schema for validation
        name: config.name, // Project name
        homepage: config.homepage, // Project homepage
        items: registryItems, // Component list
    }

    /**
     * Step 9: Write the registry.json file
     * Format with 2-space indentation for readability
     */
    const registryJson = JSON.stringify(registryData, null, 2)

    await writeFile(
        registryJsonPath,
        registryJson,
        {
            encoding: 'utf-8',
            flag: 'w',
        },
    )

    /**
     * Step 10: Display the output location to the user
     */
    console.log('registry.json path:\n', registryJsonPath)
}
