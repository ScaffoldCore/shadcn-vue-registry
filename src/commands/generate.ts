import type { ResolveConfig } from '@/types'
import fs from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { blue, red } from 'ansis'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { getDependencies } from '@/utils/dependencies.ts'
import { getRegistryType } from '@/utils/types.ts'

export async function generateRegistry(config: ResolveConfig): Promise<void> {
    const registryJsonPath = join(config.output, 'registry.json')

    console.log(blue('🔍 Scanning project for components...'))
    console.log(`Scanning directory: ${config.cwd}`)

    if (!fs.existsSync(config.cwd)) {
        throw new Error(`Directory not found: ${config.cwd}`)
    }

    // Read package.json to extract project dependencies
    const packageJsonPath = join(config.root, 'package.json')

    let dependencies: string[] = []
    let devDependencies: string[] = []

    if (fs.existsSync(packageJsonPath)) {
        try {
            const pkg = JSON.parse(await readFile(packageJsonPath, 'utf-8'))
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
        cwd: config.cwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'],
    }).map(file => dirname(file))

    // Remove duplicate directories to avoid processing the same component multiple times
    const uniqueDirs = Array.from(new Set(dirs))
    // console.log(uniqueDirs)
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

        registryItems.push(items)
        // console.log(`Dependencies: `, getDependencies(dir));
    }

    const registryData = {
        $schema: 'https://shadcn-vue.com/schema/registry.json',
        name: config.name,
        homepage: config.homepage,
        items: registryItems,
    }

    const registryJson = JSON.stringify(registryData, null, 2)

    await writeFile(
        registryJsonPath,
        registryJson,
        {
            encoding: 'utf-8',
            flag: 'w',
        },
    )

    console.log('registry.json path:\n', registryJsonPath)
}
