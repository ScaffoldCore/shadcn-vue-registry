import type { Linter } from 'eslint'
// eslint.config.mjs
import antfu from '@antfu/eslint-config'
import yamlParser from 'yaml-eslint-parser'

const config = antfu({
    type: 'lib',
    stylistic: {
        indent: 4,
        quotes: 'single',
    },
    rules: {
        'no-console': 'off',
        'node/prefer-global/process': 'off',
        'ts/explicit-function-return-type': 'off',
        'vue/block-order': 'off',
        'vue/valid-template-root': 'off',
        'unused-imports/no-unused-vars': 'off',
        'antfu/top-level-function': 'off',
    },
}, {
    files: ['**/*.yml', '**/*.yaml'],
    languageOptions: {
        parser: yamlParser,
    },
    rules: {
        'yaml/indent': ['error', 2],
    },
}) as Linter.Config

export default config
