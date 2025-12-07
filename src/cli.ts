import fs from 'node:fs/promises'
import path from 'node:path'
import { cac } from 'cac'
import ora from 'ora'
import { version } from '../package.json'
import { generateRegistry } from './commands/generate'

const cli = cac('shadcn-vue-registry')

cli
    .command('generate', 'Generate registry.json from project structure')
    .option('-o, --output <path>', 'Output path for registry.json', {
        default: '.',
    })
    .option('-c, --cwd <path>', 'Current working directory to scan', {
        default: '.',
    })
    .action(async (options) => {
        try {
            const spinner = ora('Generating registry\n\n').start()
            await generateRegistry(options.cwd, options.output)
            console.log('\n\n')
            spinner.succeed('🎉 Done, Registry generated successfully')
        }
        catch (error) {
            console.error(error)
            process.exit(1)
        }
    })

cli
    .command('init', 'Initialize a new registry configuration file in the current directory')
    .action(async (options) => {
        try {
            const configPath = path.resolve(process.cwd(), 'registry.config.ts')

            const spinner = ora('Initializing registry configuration\n').start()

            // Create the configuration file content
            const configContent = `/**
 * Registry configuration for shadcn-vue-registry(svr)
 *
 * This file defines the configuration options for generating registry.json files.
 * Customize the settings below to match your project structure.
 */

import { defineConfig } from 'shadcn-vue-registry'

export default defineConfig({
    root: '',
    name: '',
    homepage: '',
})
`

            // Write the configuration file
            await fs.writeFile(configPath, configContent, {
                encoding: 'utf-8',
                flag: 'w',
            })

            console.log('\n')
            spinner.succeed('🎉 Registry configuration initialized successfully')
            console.log('\n📝 Configuration file created:', configPath)
            console.log('\n📋 Next steps:')
            console.log('   1. Open registry.config.ts and configure the root path')
            console.log('   2. Run "svr generate" to create your registry')
            console.log('\n💡 Tip: Use "svr generate --help" for more options')
        }
        catch (error) {
            console.error('\n❌ Failed to initialize configuration:', error)
            process.exit(1)
        }
    })

cli.help()
cli.version(version)

cli.parse()
