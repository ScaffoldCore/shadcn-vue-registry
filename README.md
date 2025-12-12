# shadcn-vue-registry

> 🚀 A powerful CLI tool for automatically generating `registry.json` files for shadcn-vue components
---

## ✨ Features

**shadcn-vue-registry** is a lightweight yet robust CLI tool that provides:

| 🏗️ **Quick Initialization**     | Set up new registry projects in seconds                                   |
|----------------------------------|---------------------------------------------------------------------------|
| 🤖 **Intelligent Generation**    | Automatically generate registry files from project structure              |
| 📦 **Smart Dependency Analysis** | Auto-detect and classify dependencies (production, development, registry) |
| 🔍 **Advanced File Scanning**    | Support for Vue, TypeScript, JavaScript, JSX, and TSX files               |
| ⚙️ **Flexible Configuration**    | JSON/JS/TS configuration files with deep merging                          |
| 🎯 **Manual Dependency Control** | Override and merge dependencies manually                                  |
| 🔧 **Modular Architecture**      | Extensible and maintainable codebase                                      |

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
    name: string // Project name
    homepage: string // Project homepage
    cwd?: string // Root directory (default: '.')
    output?: string // Output directory (default: '.')
    registries?: Record<string, { // External registry configurations
        url: string
        params?: Record<string, string>
    }>
    dependencies?: string[] // Manual production dependencies
    devDependencies?: string[] // Manual development dependencies
    scanPatterns?: {
        componentPattern?: string // Component discovery pattern
        filePattern?: string // File discovery pattern
    }
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
    dependencies: ['vue', 'element-plus', 'pinia'], // Manual dependencies
    devDependencies: ['vite', 'typescript', 'unplugin-auto-import'],
    registries: {
        '~/registry/ui': 'https://registry.example.com/{name}.json'
    },
    scanPatterns: {
        componentPattern: '*/*/*',
        filePattern: '**/*'
    }
})
```

---

## 📋 Command Reference

### `init`

Initialize a new configuration file in the current directory.

```bash
shadcn-vue-registry init
```

**Options:**

| Option        | Description                           |
|---------------|---------------------------------------|
| `--force, -f` | Overwrite existing configuration file |

---

### `generate`

Generate registry.json from the project structure.

```bash
shadcn-vue-registry generate [options]
```

**Options:**

| Option                | Description                                       |
|-----------------------|---------------------------------------------------|
| `--cwd, -c <path>`    | Directory to scan for components (default: '.')   |
| `--output, -o <path>` | Output directory for registry.json (default: '.') |

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
├── registry.config.ts          # Configuration file (optional)
├── registry/                 # Components directory
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
│   ├── composables/
│   │   ├── createCancelTask.ts      # Separate component
│   │   └── createReusableTemplate.ts # Separate component
│   └── hooks/
│       └── useCounter.ts             # Separate component
└── registry.json              # Generated output
```

### 🎯 Smart Component Detection

**Directory-based Components:**

- Directories containing `index.vue` or `index.ts`
- Multiple files that should be grouped together
- Standard UI component structure

**File-based Components:**

- Single `.vue`, `.ts`, `.tsx`, `.jsx` files without `index` files
- All files in `composables/`, `utils/`, `hooks/` directories
- Each file becomes a separate component

### 📊 Component Categorization

| Directory      | Type                  | Example                  |
|----------------|-----------------------|--------------------------|
| `ui/`          | `registry:ui`         | `ui/button`              |
| `forms/`       | `registry:form`       | `forms/input`            |
| `blocks/`      | `registry:block`      | `blocks/hero`            |
| `composables/` | `registry:composable` | `composables/useCounter` |
| `hooks/`       | `registry:hook`       | `hooks/useAuth`          |
| `utils/`       | `registry:util`       | `utils/format.ts`        |

---

## 📦 Dependency Management

### Automatic Detection

The tool automatically reads and categorizes dependencies from `package.json`:

- **Production Dependencies** (`dependencies`) - Runtime requirements
- **Development Dependencies** (`devDependencies`) - Build and development tools
- **Registry Dependencies** - Inter-component relationships

### Manual Override Control

Override dependency detection manually for precise control:

```typescript
export default defineConfig({
    // Manual dependencies override automatic detection
    dependencies: ['vue', 'element-plus', 'pinia'],
    devDependencies: ['vite', 'typescript', 'unplugin-auto-import'],
})
```

### Dependency Merging Strategy

1. **Manual Dependencies** take priority
2. **Automatic Dependencies** are merged with manual ones
3. **Deduplication** prevents duplicate entries
4. **Fallback** to package.json if no manual config

---

## 🔍 Advanced File Scanning

### Supported File Types

| Extension | Description                          |
|-----------|--------------------------------------|
| `.vue`    | Vue Single File Components           |
| `.ts`     | TypeScript utilities and composables |
| `.tsx`    | TypeScript with JSX                  |
| `.jsx`    | JavaScript with JSX                  |
| `.js`     | Plain JavaScript utilities           |

### Scan Patterns

The tool supports flexible glob patterns for component discovery:

```json
{
    "scanPatterns": {
        "componentPattern": "*/*/*",
        "filePattern": "**/*"
    }
}
```

### Example Scenarios

**Scenario 1: Standard UI Component**

```
ui/button/index.vue → { name: 'button', type: 'registry:ui' }
```

**Scenario 2: Composable Function**

```
composables/useApi.ts → { name: 'useApi', type: 'registry:composable' }
```

**Scenario 3: Multi-File Component**

```
forms/input/
├── index.vue
├── Input.vue
└── input.css → { name: 'input', type: 'registry:form' }
```

---

## 📋 Generated Registry Format

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
            "files": [
                {
                    "path": "ui/button/index.vue",
                    "type": "registry:ui"
                },
                {
                    "path": "ui/button/button.ts",
                    "type": "registry:ui"
                }
            ]
        }
    ]
}
```

### Registry Item Properties

| Property               | Description                                      |
|------------------------|--------------------------------------------------|
| `name`                 | Component identifier for imports                 |
| `type`                 | Component category (ui, form, block, composable) |
| `files`                | Array of component files with types              |
| `dependencies`         | Production dependencies from package.json        |
| `devDependencies`      | Development dependencies from package.json       |
| `registryDependencies` | Internal component dependencies                  |

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

### Project Architecture

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
├── core/
│   ├── registry.config.ts   # Project configuration loading
│   ├── registry.discovery.ts # Component discovery and grouping
│   ├── registry.name.ts     # Smart component naming
│   ├── registry.processor.ts # Individual component processing
│   └── shadcn.registry.ts  # Main registry generation
└── types/
    ├── config.d.ts          # Configuration type definitions
    ├── dependencies.d.ts     # Dependency type definitions
    └── components.registry.d.ts # Registry component types
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

| 🐛 **Bug Fixes**     | Stability and error handling improvements  |
|----------------------|--------------------------------------------|
| ⚡ **Performance**    | Optimizations and caching improvements     |
| 🎨 **Features**      | New CLI commands and configuration options |
| 📚 **Documentation** | README improvements and examples           |
| 🔧 **Maintenance**   | Dependency updates and tooling upgrades    |

---

## 📄 License

This project is licensed under the **MIT License**.

- 📄 [View License](LICENSE)
- ✅ Permissive for commercial and personal use
- 🔒 No restrictions on distribution or modification

---

<div align="center">

**⭐ Star this repo if it helps you build beautiful vue components and complete the shadcn-vue ecosystem!**

</div>
