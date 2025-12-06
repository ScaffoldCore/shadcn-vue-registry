import fs from 'node:fs'
import path, { resolve, sep } from 'node:path'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { getDependencies } from '@/utils/dependencies.ts'
import { getRegistryType } from '@/utils/types.ts'

export async function generateRegistry(cwd: string, output: string): Promise<void> {
    const rootCwd = resolve(process.cwd(), `./../../${cwd}`)
    const absoluteCwd = path.resolve(process.cwd(), cwd)
    // const absoluteOutput = path.resolve(process.cwd(), output)

    console.log(`Scanning directory: ${absoluteCwd}`)

    if (!fs.existsSync(absoluteCwd)) {
        throw new Error(`Directory not found: ${absoluteCwd}`)
    }

    // Read package.json
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

    // Construct glob pattern: */*/*.{vue,js,jsx,ts,tsx}
    const dirs = globSync(`*/*/*.{${VALID_EXTENSIONS}}`, {
        cwd: absoluteCwd,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'],
    }).map(file => path.dirname(file))

    // 2. Deduplicate
    const uniqueDirs = Array.from(new Set(dirs))
    // console.log(uniqueDirs)

    // 3. Print Unique Directories
    for (const dir of uniqueDirs) {
        // 1. Get all files under current directory using globSync
        // Scan for valid extensions in the current directory only to avoid duplication
        const files = globSync(`**/*.{${VALID_EXTENSIONS}}`, {
            cwd: dir,
            absolute: true,
        })

        // 2. Define relativeDir
        const relativeDir = path.relative(absoluteCwd, dir)

        // 3. Get category
        const category = relativeDir.split(sep).shift() as string
        const name = relativeDir.split(sep).pop()!

        const type: string = getRegistryType(relativeDir)

        // console.log(`Type: ${type}`)
        //
        // console.log(`Directory: ${relativeDir}, Category: ${category}`)
        // console.log(`Files:`, files.map(f => path.relative(dir, f)))

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
        const pkgDependencies = getDependencies(dir, dependencies, devDependencies, {
            thirdParty: {
                '~/registry/ui': 'https://baidu.com/{name}.json',
            },
        })
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
