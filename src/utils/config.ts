/**
 * Configuration utilities for shadcn-vue-registry
 */

import type { Jiti } from 'jiti'
import type { RegistryConfig } from '@/types'
import { resolve } from 'node:path'
import * as process from 'node:process'
import defu from 'defu'
import { findUp } from 'find-up'
import { createJiti } from 'jiti'
import { DEFAULT_CONFIG_FILES } from '@/constant/comman.ts'

export const defaultConfig: RegistryConfig = {
    root: process.cwd(),
    name: '',
    homepage: '',
}

export const defineConfig = (config: RegistryConfig): RegistryConfig => {
    return config
}

export const loadConfig = async (): Promise<RegistryConfig> => {
    const resolveConfigPath = await findUp(DEFAULT_CONFIG_FILES.map((filePath: string) => resolve(process.cwd(), filePath)))

    if (!resolveConfigPath) {
        throw new Error('No config file found')
    }

    const loader: Jiti = createJiti(process.cwd(), {
        extensions: ['.js', '.ts', '.mjs', '.cjs', '.mts', '.cts'],
    })

    const resolveConfig: RegistryConfig = await loader.import(`${resolveConfigPath}?t=${Date.now()}`, {
        default: true,
    })

    return defu(resolveConfig, defaultConfig)
}
