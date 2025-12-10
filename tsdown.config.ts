import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/cli.ts', 'src/index.ts'],
    dts: true,
    clean: true,
    sourcemap: true,
})
