/**
 * Configuration types for shadcn-vue-registry
 */
import type { IComponentsRegistry } from '#/components.registry'

export interface RegistryConfig {
    root: string
    name: string
    homepage: string
    cwd?: string
    output?: string
    registries?: IComponentsRegistry
    scanPatterns?: {
        /** Component discovery pattern for finding component directories */
        componentPattern?: string
        /** File discovery pattern for scanning files within components */
        filePattern?: string
    }
}

export interface IGenerateOptions {
    cwd: string
    c?: string
    o?: string
    output: string
}

export type ResolveConfig = RegistryConfig & IGenerateOptions
