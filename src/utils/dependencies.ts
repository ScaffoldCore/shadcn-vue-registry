import type { IComponentsRegistry } from '#/components.registry'
import type { IDependencies } from '#/dependencies'
import fs from 'node:fs'
import { globSync } from 'glob'
import { VALID_EXTENSIONS } from '@/constant/comman.ts'
import { escapeRegExp, getPackageName } from '@/utils/utils.ts'

export function getDependencies(
    dir: string,
    compiledDependencies: string[],
    compiledDevDependencies: string[],
    shadcnConfig?: {
        thirdParty?: IComponentsRegistry
    },
): IDependencies {
    const files = globSync(`**/*.{${VALID_EXTENSIONS}}`, {
        cwd: dir,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    })

    const depSet = new Set(compiledDependencies)
    const devDepSet = new Set(compiledDevDependencies)

    const dependencies = new Set<string>()
    const devDependencies = new Set<string>()
    const registryDependencies = new Set<string>()

    // ✅ 使用 global flag (g) 以配合 matchAll
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g
    const SHADCN_REGEX = /(?:^|\/)components\/ui\/([^/]+)/
    const IGNORE_UTILS_REGEX = /(?:^|\/)lib\/utils$/

    // 预处理配置
    const thirdPartyConfig = shadcnConfig?.thirdParty ?? {}
    const thirdPartyMatchers = Object.entries(thirdPartyConfig).map(([prefix, value]) => {
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

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8')

        const matches = content.matchAll(importRegex)

        for (const match of matches) {
            const originalDep = match[1]

            if (!originalDep)
                continue

            if (originalDep.startsWith('.'))
                continue

            // normalization processing
            const dep = originalDep.normalize('NFKC')

            if (IGNORE_UTILS_REGEX.test(dep))
                continue

            const pkgName = getPackageName(dep)

            if (depSet.has(pkgName)) {
                dependencies.add(pkgName)
                continue
            }

            if (devDepSet.has(pkgName)) {
                devDependencies.add(pkgName)
                continue
            }

            const shadcnExec = SHADCN_REGEX.exec(dep)
            if (shadcnExec?.[1]) {
                registryDependencies.add(shadcnExec[1])
                continue
            }

            let hitThirdParty = false
            for (const item of thirdPartyMatchers) {
                if (!item.regex.test(dep))
                    continue

                const name = dep.slice(item.prefixLength + 1)
                if (!name)
                    break

                let url = item.urlTemplate.replace('{name}', name)
                if (item.params && Object.keys(item.params).length > 0) {
                    const searchParams = new URLSearchParams(item.params)
                    url += `?${searchParams.toString()}`
                }

                registryDependencies.add(url)
                hitThirdParty = true
                break
            }

            if (hitThirdParty)
                continue

            registryDependencies.add(dep)
        }
    }

    return {
        dependencies: Array.from(dependencies).sort(),
        devDependencies: Array.from(devDependencies).sort(),
        registryDependencies: Array.from(registryDependencies).sort(),
    }
}
