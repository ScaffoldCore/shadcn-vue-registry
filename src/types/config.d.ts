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
}
