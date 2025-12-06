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

cli.help()
cli.version(version)

cli.parse()
