/**
 * Registry type definitions for categorizing components and files.
 *
 * This mapping defines how different directory names correspond to registry types.
 * Both singular and plural forms are supported for flexibility.
 */

// Core registry type constants for type safety
export const REGISTRY_TYPES = {
    LIB: 'registry:lib',
    BLOCK: 'registry:block',
    COMPONENT: 'registry:component',
    UI: 'registry:ui',
    HOOK: 'registry:hook',
    COMPOSABLE: 'registry:composable',
    PAGE: 'registry:page',
    FILE: 'registry:file',
    THEME: 'registry:theme',
    STYLE: 'registry:style',
    ITEM: 'registry:item',
} as const

// Type registry for auto-completion and type safety
export type RegistryType = typeof REGISTRY_TYPES[keyof typeof REGISTRY_TYPES]

/**
 * Optimized type mapping with singular/plural support.
 *
 * Key optimizations:
 * - Grouped by logical categories
 * - Supports both singular and plural forms
 * - Uses constants for maintainability
 * - Easy to extend with new types
 */
export const typeMap: Record<string, RegistryType> = {
    // Library/Utility types
    lib: REGISTRY_TYPES.LIB,

    // Block/Component types
    block: REGISTRY_TYPES.BLOCK,
    blocks: REGISTRY_TYPES.BLOCK,
    component: REGISTRY_TYPES.COMPONENT,
    components: REGISTRY_TYPES.COMPONENT,

    // UI components
    ui: REGISTRY_TYPES.UI,

    // Vue composition
    hook: REGISTRY_TYPES.HOOK,
    composable: REGISTRY_TYPES.COMPOSABLE,
    composables: REGISTRY_TYPES.COMPOSABLE,

    // Page/Route types
    page: REGISTRY_TYPES.PAGE,
    pages: REGISTRY_TYPES.PAGE,

    // File/Asset types
    file: REGISTRY_TYPES.FILE,
    files: REGISTRY_TYPES.FILE,

    // Styling/Theme types
    theme: REGISTRY_TYPES.THEME,
    style: REGISTRY_TYPES.STYLE,

    // Generic item type
    item: REGISTRY_TYPES.ITEM,
}

/**
 * Reverse lookup map for validating and debugging registry types.
 * Useful for type checking and validation.
 */
export const reverseTypeMap: Record<RegistryType, string[]> = Object.entries(typeMap).reduce(
    (acc, [key, value]) => {
        if (!acc[value])
            acc[value] = []
        acc[value].push(key)
        return acc
    },
    {} as Record<RegistryType, string[]>,
)
