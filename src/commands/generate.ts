import type { IDependencies } from '#/dependencies'
import fs from 'node:fs'
import path, { resolve, sep } from 'node:path'
import { globSync } from 'glob'
import { getRegistryType } from '@/utils/types.ts'

// Valid extensions
const VALID_EXTENSIONS = ['vue', 'js', 'jsx', 'ts', 'tsx'].join(',')

function getDependencies(dir: string, compiledDependencies: string[], compiledDevDependencies: string[]): IDependencies {
    const files = globSync(`**/*.{${VALID_EXTENSIONS}}`, {
        cwd: dir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**'],
    })

    const dependencies = new Set<string>()
    const devDependencies = new Set<string>()
    const registryDependencies = new Set<string>()
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')
        let match

        // Reset regex state
        importRegex.lastIndex = 0

        // eslint-disable-next-line no-cond-assign
        while ((match = importRegex.exec(content)) !== null) {
            const dep = match[1] as string
            if (dep.startsWith('.'))
                continue

            // Handle scoped packages and subpaths
            let pkgName: string = dep
            if (dep.startsWith('@')) {
                const parts = dep.split('/')
                if (parts.length >= 2) {
                    pkgName = `${parts[0]}/${parts[1]}`
                }
            }
            else {
                pkgName = dep.split('/')[0] as string
            }

            if (compiledDependencies.includes(pkgName)) {
                dependencies.add(pkgName)
            }
            else if (compiledDevDependencies.includes(pkgName)) {
                devDependencies.add(pkgName)
            }
            else {
                // For registry dependencies (aliases or explicit registry items), we keep the full path/import
                // or just the package/alias? The prompt says: "If unable to match... registryDependencies... user determines".
                // Usually registry dependencies are like "ui/button" or "@/components/ui/button".
                // We'll keep the original import string for now as it provides more context,
                // or should we process it? The prompt implies "projectPackage" for deps/devDeps matching.
                // For registry, it might be the full import string.
                registryDependencies.add(dep)
            }
        }
    }

    return {
        dependencies: Array.from(dependencies),
        devDependencies: Array.from(devDependencies),
        registryDependencies: Array.from(registryDependencies),
    }
}

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
        const pkgDependencies = getDependencies(dir, dependencies, devDependencies)
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
        // console.log(`items:`, {
        //     name,
        //     type,
        //     dependencies: getDependencies(dir, dependencies, devDependencies),
        //     items: [],
        // })

        console.log(items)

        // console.log(`Dependencies: `, getDependencies(dir));
    }
}
