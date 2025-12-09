# shadcn-vue-registry

> 🚀 A powerful CLI tool for automatically generating `registry.json` files for shadcn-vue components, streamlining your
> component library development workflow.

---

## ✨ Features

shadcn-vue-registry is a lightweight yet robust CLI tool that provides:

- 🏗️ **Quick Initialization** - Set up new registry projects in seconds
- 🤖 **Intelligent Generation** - Automatically generate registry files from project structure
- 📦 **Smart Dependency Analysis** - Auto-detect and classify dependencies (production, development, registry)
- 🔍 **Advanced File Scanning** - Support for Vue, TypeScript, JavaScript, JSX, and TSX files
- ⚙️ **Flexible Configuration** - JSON/JS/TS configuration files with deep merging

Perfect for teams and individual developers building private or public shadcn-vue component registries.

---

## 📦 Installation

### Global Installation

Install globally to use the CLI anywhere in your projects:

```bash
# npm
npm install -g shadcn-vue-registry

# pnpm
pnpm add -g shadcn-vue-registry

# yarn
yarn global add shadcn-vue-registry
```

### Local Installation

Install as a dev dependency in your project:

```bash
# npm
npm install -D shadcn-vue-registry

# pnpm
pnpm add -D shadcn-vue-registry

# yarn
yarn add -D shadcn-vue-registry
```

---

## 🚀 Quick Start

### Initialize New Project

Create a new registry configuration file:

```bash
svr init
```

This creates a `registry.config.ts` file in your current directory:

```typescript
import { defineConfig } from 'shadcn-vue-registry'

export default defineConfig({
    root: '', // Path to your components
    name: '', // Project name
    homepage: '', // Project homepage
})
```

### Generate Registry

Generate registry.json from your project:

```bash
# Using configuration file
shadcn-vue-registry generate

# With custom options
shadcn-vue-registry generate --cwd ./src/components --output ./registry

# Using shorter binary
svr generate -o ./registry -c ./components
```

---

## 🛠 Configuration

### Configuration File

The tool searches for configuration files in this order of priority:

1. `registry.config.ts`
2. `registry.config.js`
3. `registry.config.json`
4. `.registryrc.json`

### Configuration Options

```typescript
interface RegistryConfig {
    root: string // Path to components directory (required)
    name?: string // Project name (optional)
    homepage?: string // Project homepage (optional)
    output?: string // Output directory (default: '.')
    thirdParty?: Record<string, string | { url: string, params?: Record<string, string> }>
}
```

### Example Configuration

```typescript
import { defineConfig } from 'shadcn-vue-registry'

export default defineConfig({
    root: './src/components',
    name: 'My UI Components',
    homepage: 'https://my-ui-components.com',
    output: './registry',
    thirdParty: {
        '~/registry/ui': 'https://registry.example.com/{name}.json'
    }
})
```

---

## 📋 Command Reference

### `init`

Initialize a new configuration file in the current directory.

```bash
shadcn-vue-registry init [--force]
```

**Options:**

- `--force, -f` - Overwrite existing configuration file

### `generate`

Generate registry.json from project structure.

```bash
shadcn-vue-registry generate [options]
```

**Options:**

- `--cwd, -c <path>` - Directory to scan for components (default: '.')
- `--output, -o <path>` - Output directory for registry.json (default: '.')

**Priority System:**

1. CLI options take precedence over configuration file
2. Configuration file values are used as fallbacks
3. Sensible defaults are applied when neither are specified

---

## 🏗️ Project Structure

The tool automatically detects and processes the following shadcn-vue structure:

```
your-project/
├── package.json              # For dependency analysis
├── components/
│   ├── ui/
│   │   ├── button/
│   │   │   ├── index.vue
│   │   │   ├── Button.vue
│   │   │   └── button.ts
│   │   ├── card/
│   │   │   ├── index.vue
│   │   │   └── card.ts
│   ├── forms/
│   │   └── input/
│   │       └── index.vue
│   └── hooks/
│       └── useCounter.ts
└── registry.config.ts           # Configuration file (optional)
```

**Automatic Processing:**

- ✅ Scans for `.vue`, `.ts`, `.tsx`, `.js`, `.jsx` files
- ✅ Extracts component metadata from directory structure
- ✅ Analyzes dependencies from `package.json`
- ✅ Categorizes imports (production, development, registry)
- ✅ Generates shadcn-vue compliant registry.json

---

## 📊 Generated Registry Format

The tool generates a shadcn-vue compatible `registry.json`:

```json
{
    "$schema": "https://shadcn-vue.com/schema/registry.json",
    "name": "My UI Components",
    "homepage": "https://my-ui-components.com",
    "items": [
        {
            "name": "button",
            "type": "registry:ui",
            "items": [
                {
                    "path": "ui/button/index.vue",
                    "type": "registry:ui"
                },
                {
                    "path": "ui/button/button.ts",
                    "type": "registry:ui"
                }
            ],
            "dependencies": [
                "vue",
                "@vue/runtime-core"
            ]
        }
    ]
}
```

---

## 🛠 Development

### Setup Development Environment

Clone and set up the project:

```bash
git clone https://github.com/ScaffoldCore/shadcn-vue-registry.git
cd shadcn-vue-registry
pnpm install
```

### Available Scripts

```bash
# Start development with file watching
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Project Structure

```
src/
├── cli.ts                 # CLI entry point and command definitions
├── commands/
│   └── generate.ts      # Registry generation logic
├── utils/
│   ├── config.ts          # Configuration loading and resolution
│   ├── dependencies.ts    # Dependency analysis and classification
│   ├── types.ts          # Registry type detection
│   └── utils.ts          # Utility functions
├── constant/
│   ├── comman.ts          # Constants and file extensions
│   └── typeMap.ts         # Type mapping definitions
└── types/
    ├── config.d.ts          # Configuration type definitions
    ├── dependencies.d.ts     # Dependency type definitions
    └── components.registry.d.ts # Registry component types
```

---

## 🧪 Testing

```bash
# Run tests (when available)
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### 🍴 Development Workflow

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes with proper TypeScript types
5. **Test** your changes thoroughly
6. **Commit** with clear messages: `git commit -m 'Add: amazing feature'`
7. **Push** to your fork: `git push origin feature/amazing-feature`
8. **Open** a Pull Request with detailed description

### 📋 Contribution Guidelines

- **Code Style:** Follow existing patterns and ESLint configuration
- **Type Safety:** Ensure all TypeScript types are correct
- **Documentation:** Update README and JSDoc comments
- **Tests:** Add unit tests for new features
- **Breaking Changes:** Update version numbers and migration guides

### 🏷️ Areas to Contribute

- 🐛 **Bug Fixes:** Stability and error handling improvements
- ⚡ **Performance:** Optimizations and caching improvements
- 🎨 **Features:** New CLI commands and configuration options
- 📚 **Documentation:** README improvements and examples
- 🔧 **Maintenance:** Dependency updates and tooling upgrades

---

## 📄 License

This project is licensed under the **MIT License**.

- 📄 [View License](LICENSE)
- ✅ Permissive for commercial and personal use
- 🔒 No restrictions on distribution or modification

---

<div align="center">

**⭐ Star this repo if it helped you build amazing Vue components!**

</div>
