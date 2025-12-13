import type { IComponentsRegistry } from '#/components.registry'
import type { IDependencies } from '#/dependencies'
import fs from 'node:fs'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { escapeRegExp, getPackageName } from '@/utils/utils.ts'

/**
 * Analyzes and categorizes dependencies from component files by scanning import statements.
 *
 * This function performs comprehensive dependency analysis by:
 * 1. Scanning all valid files in the specified directory
 * 2. Extracting import statements using regex patterns
 * 3. Categorizing dependencies while excluding those already in package.json
 * 4. Handling third-party registry mappings with URL templates
 * 5. Recognizing common third-party libraries that might be missing from package.json
 *
 * @param dir - Directory path to scan for dependency analysis
 * @param compiledDependencies - Array of production dependencies from package.json
 * @param compiledDevDependencies - Array of development dependencies from package.json
 * @param shadcnConfig - Optional configuration object for third-party registry mappings
 * @param shadcnConfig.registries - Registry mapping configuration for third-party components
 * @returns Object containing categorized dependencies, each as sorted arrays
 *
 * @example
 * ```typescript
 * const deps = getDependencies(
 *   './components/button',
 *   ['vue', '@vue/runtime-core'],
 *   ['typescript', 'vite'],
 *   {
 *     registries: {
 *       '~/registry/ui': 'https://registry.example.com/{name}.json',
 *     }
 *   }
 * )
 * ```
 */
export function getDependencies(
    dir: string,
    compiledDependencies: string[],
    compiledDevDependencies: string[],
    shadcnConfig?: {
        registries?: IComponentsRegistry
    },
    options?: {
        /** Specific files to analyze instead of scanning directory */
        files?: string[]
    },
): IDependencies {
    // Use provided files or scan for all valid component files in the directory
    const files = options?.files
        ? options.files.filter(file => file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.js'))
        : globSync(`**/*.{${VALID_EXTENSIONS}}`, {
                cwd: dir,
                absolute: true,
                ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
            })

    // Convert dependency arrays to Sets for efficient lookup
    const depSet = new Set(compiledDependencies)
    const devDepSet = new Set(compiledDevDependencies)

    // Third-party libraries that might be used at runtime but could be missing from package.json
    // Note: Core libraries like 'vue' should always be in package.json dependencies
    const knownThirdPartyLibs = [
        'vue-router',
        'pinia',
        'vue',
        'unplugin-vue-components',
        'unplugin-auto-import',
    ]

    // Initialize Sets to store categorized dependencies
    const dependencies = new Set<string>()
    const devDependencies = new Set<string>()
    const registryDependencies = new Set<string>()

    // Regex patterns for dependency extraction
    // ✅ Use global flag (g) to work with matchAll
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g
    const SHADCN_REGEX = /(?:^|\/)components\/ui\/([^/]+)/ // Matches shadcn-vue UI components
    const IGNORE_UTILS_REGEX = /(?:^|\/)lib\/utils$/ // Ignores common utility imports

    // Preprocess third-party configuration for efficient matching
    const registryConfig = shadcnConfig?.registries ?? {}
    const registryMatchers = Object.entries(registryConfig).map(([prefix, value]) => {
        const normalizedPrefix = prefix.normalize('NFKC')
        const escapedPrefix = escapeRegExp(normalizedPrefix)
        const urlTemplate = typeof value === 'string' ? value : value.url
        const params = typeof value === 'string' ? undefined : value.params

        return {
            prefixLength: normalizedPrefix.length,
            regex: new RegExp(`^${escapedPrefix}(?:/|$)`),
            urlTemplate,
            params,
        }
    })

    // Process each file to extract and categorize dependencies
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')

        // Find all import/export statements in the file
        const matches = content.matchAll(importRegex)

        for (const match of matches) {
            const originalDep = match[1]

            // Skip empty matches
            if (!originalDep)
                continue

            // Skip relative imports (local files)
            if (originalDep.startsWith('.'))
                continue

            // Unicode normalization for consistent dependency handling
            const dep = originalDep.normalize('NFKC')

            // Skip common utility imports that don't need to be tracked
            if (IGNORE_UTILS_REGEX.test(dep))
                continue

            // Extract package name for dependency matching
            const pkgName = getPackageName(dep)

            // Skip known third-party libraries that are likely to be used at runtime
            if (knownThirdPartyLibs.includes(pkgName)) {
                continue
            }

            // Categorize as production dependency if found in package.json dependencies
            if (depSet.has(pkgName)) {
                dependencies.add(pkgName)
                continue
            }

            // Categorize as development dependency if found in package.json devDependencies
            if (devDepSet.has(pkgName)) {
                devDependencies.add(pkgName)
                continue
            }

            // Handle shadcn-vue UI component imports
            const shadcnExec = SHADCN_REGEX.exec(dep)
            if (shadcnExec?.[1]) {
                registryDependencies.add(shadcnExec[1])
                continue
            }

            // Check for third-party registry dependencies using configured matchers
            let hitRegistry = false
            for (const item of registryMatchers) {
                if (!item.regex.test(dep))
                    continue

                // Extract component name from the dependency path
                const name = dep.slice(item.prefixLength + 1)
                if (!name)
                    break

                // Generate URL using the template with component name substitution
                let url = item.urlTemplate.replace('{name}', name)
                if (item.params && Object.keys(item.params).length > 0) {
                    const searchParams = new URLSearchParams(item.params)
                    url += `?${searchParams.toString()}`
                }

                registryDependencies.add(url)
                hitRegistry = true
                break
            }

            // Skip to next dependency if third-party matching was successful
            if (hitRegistry)
                continue

            // Default case: treat as registry dependency
            // For internal component dependencies (like @/registry/components/card),
            // extract only the component name
            if (dep.startsWith('@/registry/')) {
                const parts = dep.split('/')
                if (parts.length >= 3) {
                    // Extract component name from path like @/registry/components/card -> card
                    const componentName = parts[parts.length - 1]
                    if (componentName && componentName !== '') {
                        registryDependencies.add(componentName)
                        continue
                    }
                }
            }
            registryDependencies.add(dep)
        }
    }

    // Return categorized dependencies as sorted arrays for consistent output
    return {
        dependencies: Array.from(dependencies).sort(),
        devDependencies: Array.from(devDependencies).sort(),
        registryDependencies: Array.from(registryDependencies).sort(),
    }
}
