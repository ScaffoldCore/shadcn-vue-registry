import fs from 'node:fs'
import path, { resolve, sep } from 'node:path'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { getDependencies } from '@/utils/dependencies.ts'
import { getRegistryType } from '@/utils/types.ts'

/**
 * Generates a registry.json file by scanning the project structure and analyzing component dependencies.
 *
 * This function performs the following operations:
 * 1. Scans the specified directory for component files matching valid extensions
 * 2. Reads package.json to extract project dependencies
 * 3. Analyzes each component directory to determine file structure and dependencies
 * 4. Generates registry items with proper metadata and dependency information
 *
 * @param cwd - Current working directory to scan for components (relative to project root)
 * @param output - Output directory path where the registry.json will be generated
 * @returns Promise that resolves when registry generation is complete
 *
 * @throws {Error} When the specified directory doesn't exist
 *
 * @example
 * ```typescript
 * await generateRegistry('./components', './registry')
 * // This will scan the ./components directory and generate registry.json in ./registry
 * ```
 */
export async function generateRegistry(cwd: string, output: string): Promise<void> {
    const rootCwd = resolve(process.cwd(), `./../../${cwd}`)
    const absoluteCwd = path.resolve(process.cwd(), cwd)
    // const absoluteOutput = path.resolve(process.cwd(), output)

    console.log(`Scanning directory: ${absoluteCwd}`)

    if (!fs.existsSync(absoluteCwd)) {
        throw new Error(`Directory not found: ${absoluteCwd}`)
    }

    // Read package.json to extract project dependencies
    const packageJsonPath = path.join(rootCwd, 'package.json')

    let dependencies: string[] = []
    let devDependencies: string[] = []

    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
            dependencies = Object.keys(pkg.dependencies || {})
            devDependencies = Object.keys(pkg.devDependencies || {})
        }
        catch (e) {
            console.warn('Failed to read package.json, dependency classification may be incomplete.')
        }
    }

    // Construct glob pattern to find component directories: */*/*.{vue,js,jsx,ts,tsx}
    // This pattern matches the typical shadcn-vue structure: category/component-name/files
    const dirs = globSync(`*/*/*.{${VALID_EXTENSIONS}}`, {
        cwd: absoluteCwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'],
    }).map(file => path.dirname(file))

    // Remove duplicate directories to avoid processing the same component multiple times
    const uniqueDirs = Array.from(new Set(dirs))
    // console.log(uniqueDirs)

    // Process each unique component directory
    for (const dir of uniqueDirs) {
        // Scan for all valid files in the current component directory
        // This ensures we capture all related files for the component
        const files = globSync(`**/*.{${VALID_EXTENSIONS}}`, {
            cwd: dir,
            absolute: true,
        })

        // Calculate relative path from the scanned directory to current component
        const relativeDir = path.relative(absoluteCwd, dir)

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
        // console.log(`Files:`, files.map(f => path.relative(dir, f)))

        // Build the registry item structure
        const items = {
            name,
            type,
            items: files.map((file) => {
                const relativeFile = path.relative(dir, file)
                const relativeFilePath = path.join(relativeDir, relativeFile)
                return {
                    path: relativeFilePath,
                    type: getRegistryType(relativeFilePath),
                }
            }),
        }

        // Analyze and categorize dependencies for the component
        const pkgDependencies = getDependencies(dir, dependencies, devDependencies, {
            thirdParty: {
                '~/registry/ui': 'https://baidu.com/{name}.json',
            },
        })

        // Attach categorized dependencies to the registry item
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

        console.log(items)

        // console.log(`Dependencies: `, getDependencies(dir));
    }
}
