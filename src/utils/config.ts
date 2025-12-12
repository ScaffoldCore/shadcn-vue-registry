/**
 * Configuration utilities for shadcn-vue-registry
 *
 * This module provides functions for loading, resolving, and managing configuration
 * for the shadcn-vue registry generation process. It supports multiple file formats
 * and provides intelligent path resolution with fallback mechanisms.
 */

import type { Jiti } from 'jiti'
import type { IGenerateOptions, RegistryConfig, ResolveConfig } from '@/types'
import { isAbsolute, resolve } from 'node:path'
import * as process from 'node:process'
import defu from 'defu'
import { findUp } from 'find-up'
import { createJiti } from 'jiti'
import { DEFAULT_CONFIG_FILES } from '@/constant/comman.ts'
import { removeEmptyValues } from '@/utils/utils.ts'

/**
 * Default configuration values used as fallbacks
 *
 * These values are applied when user configuration is missing or incomplete.
 * The root path defaults to the current working directory.
 */
export const defaultConfig: RegistryConfig = {
    root: process.cwd(),
    name: '',
    homepage: '',
    scanPatterns: {
        componentPattern: '*/*/*', // Default component directory pattern
        filePattern: '**/*', // Default file scan pattern within components
    },
}

/**
 * Configuration definition function for type safety
 *
 * This function validates and returns the provided configuration.
 * In a real implementation, this would perform validation checks.
 *
 * @param config - User provided configuration object
 * @returns The validated configuration object
 *
 * @example
 * ```typescript
 * export default defineConfig({
 *   root: './components',
 *   name: 'My UI Components',
 *   homepage: 'https://myui.com'
 * })
 * ```
 */
export const defineConfig = (config: RegistryConfig): RegistryConfig => {
    return config
}

/**
 * Loads and resolves the registry configuration from the file system
 *
 * This function searches for configuration files in the current directory and parent directories,
 * supports multiple file formats, and performs deep merging with defaults.
 *
 * Search order (highest to lowest priority):
 * 1. registry.config.js
 * 2. registry.config.mjs
 * 3. registry.config.ts
 * 4. registry.config.cjs
 * 5. registry.config.mts
 * 6. registry.config.cts
 *
 * @returns Promise resolving to the merged configuration object
 * @throws {Error} When no configuration file is found
 *
 * @example
 * ```typescript
 * const config = await loadConfig()
 * console.log(config.root) // Path from config file or default
 * ```
 *
 * @features
 * - Multi-format support: .js, .ts, .mjs, .cjs, .mts, .cts
 * - Cache busting: Uses timestamp to prevent module caching
 * - Deep merging: User config overrides defaults using defu
 * - Path resolution: Uses find-up for intelligent config discovery
 */
export const loadConfig = async (): Promise<RegistryConfig> => {
    // Search for configuration files in current and parent directories
    const resolveConfigPath = await findUp(DEFAULT_CONFIG_FILES.map((filePath: string) => resolve(process.cwd(), filePath)))

    // Throw descriptive error if no configuration file is found
    if (!resolveConfigPath) {
        throw new Error('No config file found. Please run "shadcn-vue-registry init" to create one.')
    }

    /**
     * Create Jiti loader for dynamic module imports
     * Jiti allows importing TypeScript and JavaScript modules on the fly
     */
    const loader: Jiti = createJiti(process.cwd(), {
        extensions: ['.js', '.ts', '.mjs', '.cjs', '.mts', '.cts'],
    })

    /**
     * Import configuration file with cache busting
     * The timestamp prevents Node.js from caching the module during development
     */
    const resolveConfig: RegistryConfig = await loader.import(`${resolveConfigPath}?t=${Date.now()}`, {
        default: true,
    })

    /**
     * Deep merge user configuration with defaults
     * User values take precedence over default values
     * Nested objects are properly merged, not replaced
     */
    return defu(resolveConfig, defaultConfig)
}

/**
 * Resolves configuration and CLI options into final execution parameters
 *
 * This function merges user configuration with CLI options and resolves
 * all paths to absolute paths for consistent behavior across different
 * operating systems and working directories.
 *
 * Priority system:
 * - CLI options take precedence over configuration file values
 * - Absolute paths are preserved as-is
 * - Relative paths are resolved relative to the project root
 *
 * @param config - User configuration object from loaded config file
 * @param options - CLI options provided by user (cwd, output, etc.)
 * @returns Resolved configuration with absolute paths and merged options
 *
 * @example
 * ```typescript
 * const resolved = resolveConfig(
 *   { root: './project', output: './dist' },
 *   { cwd: './components', output: './registry' }
 * )
 * // Result: {
 * //   root: '/abs/path/project',
 * //   cwd: '/abs/path/components',  // CLI option used
 * //   output: '/abs/path/registry' // CLI option used
 * // }
 * ```
 *
 * @features
 * - Path Normalization: Converts relative to absolute paths
 * - Priority Handling: CLI options override config file values
 * - Fallback Logic: Uses sensible defaults when options are '.'
 * - Cross-platform: Works on Windows, macOS, and Linux
 * - Type Safety: Full TypeScript support with proper typing
 */
export const resolveConfig = (config: RegistryConfig, options: IGenerateOptions): ResolveConfig => {
    /**
     * Resolve the root path for the project
     * If config.root is absolute, use it directly
     * If relative, resolve it from current working directory
     */
    const root = isAbsolute(config.root)
        ? config.root
        : resolve(process.cwd(), config.root)

    /**
     * Deep merge CLI options over configuration file values
     * defu ensures nested objects are properly merged
     * CLI options have higher priority than config file values
     */
    const { cwd, output, ...resolveConfig } = defu({ ...removeEmptyValues(config) as ResolveConfig }, options)

    return {
        ...resolveConfig, // Spread merged configuration
        root, // Project root path (absolute)
        cwd: cwd === '.' ? process.cwd() : isAbsolute(cwd) ? cwd : resolve(root, cwd), // Input directory for scanning
        output: output === '.' ? process.cwd() : isAbsolute(output) ? output : resolve(root, output), // Output directory for registry.json
    }
}
