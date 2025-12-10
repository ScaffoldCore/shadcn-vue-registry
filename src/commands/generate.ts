import type { ResolveConfig } from '@/types'
import fs from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { blue } from 'ansis'
import { generateShadcnRegistry } from '@/core/shadcn.registry.ts'

/**
 * Generates a shadcn-vue registry.json file from the project component structure.
 *
 * This command analyzes the project directory structure, scans for components,
 * analyzes their dependencies, and creates a registry.json file compatible with
 * shadcn-vue's component system.
 *
 * @param config - Configuration containing paths and project metadata
 * @param config.cwd - Component scan directory path
 * @param config.root - Project root directory for package.json access
 * @param config.output - Output directory for registry.json
 * @param config.name - Project name for registry metadata
 * @param config.homepage - Project homepage for registry metadata
 * @throws {Error} When the scan directory doesn't exist
 *
 * @example
 * ```typescript
 * await generateRegistry({
 *   cwd: './src/components',
 *   root: '/project',
 *   output: './dist',
 *   name: 'My UI Kit',
 *   homepage: 'https://myui.com'
 * })
 * ```
 */
export async function generateRegistry(config: ResolveConfig): Promise<void> {
    // Output file path for the generated registry.json
    const registryJsonPath = join(config.output, 'registry.json')

    // Log the scanning process start
    console.log(blue('🔍 Scanning project for components...'))
    console.log(`Scanning directory: ${config.cwd}`)

    // Validate the source directory exists
    if (!fs.existsSync(config.cwd)) {
        throw new Error(`Directory not found: ${config.cwd}`)
    }

    // Generate the registry data from project structure
    const registryData = await generateShadcnRegistry(config)
    const registryJson = JSON.stringify(registryData, null, 2)

    // Write the registry.json file to disk
    await writeFile(
        registryJsonPath,
        registryJson,
        {
            encoding: 'utf-8',
            flag: 'w',
        },
    )

    // Display the output location
    console.log('registry.json path:\n', registryJsonPath)
}
