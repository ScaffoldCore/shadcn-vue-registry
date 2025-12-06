# shadcn-vue-registry CLI

🚀 A powerful command-line tool for automatically generating `registry.json` files for shadcn-vue components, streamlining your component library development workflow.

---

## ✨ Features

shadcn-vue-registry is a lightweight yet robust CLI tool designed to help developers:

- 🏗️ **Quickly initialize** shadcn-vue component Registry projects
- 🤖 **Automatically generate** Registry configuration files
- 📦 **Smart dependency detection** and classification
- 🔍 **Intelligent file scanning** with support for multiple file types
- ⚙️ **Flexible configuration** options for custom workflows

Perfect for teams and individual developers building private or public shadcn-vue component registries.

---

## 📦 Installation

### Global Installation

Install globally to use the CLI anywhere in your projects:

```bash
npm install -g shadcn-vue-registry
# or
pnpm add -g shadcn-vue-registry
# or
yarn global add shadcn-vue-registry
```

### Local Installation

Install as a dev dependency in your project:

```bash
npm install -D shadcn-vue-registry
# or
pnpm add -D shadcn-vue-registry
# or
yarn add -D shadcn-vue-registry
```

---

## 🚀 Usage

### Basic Usage

Generate registry.json from your current project structure:

```bash
shadcn-vue-registry generate
```

### Advanced Usage

Generate registry with custom options:

```bash
shadcn-vue-registry generate --output ./registry --cwd ./components
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output path for registry.json | `.` |
| `--cwd` | `-c` | Current working directory to scan | `.` |
| `--help` | `-h` | Display help information | |
| `--version` | `-v` | Show version number | |

### Using the Binary

After installation, you can also use the shorter binary command:

```bash
svr generate --output ./registry
```

---

## 🏗️ Project Structure

The CLI automatically scans your project structure and generates registry files based on the following pattern:

```
your-project/
├── components/
│   ├── ui/
│   │   ├── button/
│   │   │   ├── index.vue
│   │   │   └── button.ts
│   │   └── card/
│   │       ├── index.vue
│   │       └── card.ts
│   └── forms/
│       └── input/
│           └── index.vue
└── package.json
```

The tool will automatically:
- Scan for Vue, TypeScript, and JavaScript files
- Extract component metadata
- Analyze dependencies from `package.json`
- Generate proper registry structure

---

## 🛠 Development

### Local Development

Set up the development environment:

```bash
git clone https://github.com/ScaffoldCore/shadcn-vue-registry.git
cd shadcn-vue-registry
pnpm install
pnpm dev
```

### Building

Build the project for distribution:

```bash
pnpm build
```

### Linting

Check and fix code style:

```bash
pnpm lint          # Check for linting issues
pnpm lint:fix      # Fix linting issues automatically
```

---

## 📚 API Reference

### generateRegistry(cwd, output)

The core function that generates registry files.

**Parameters:**
- `cwd` (string): Current working directory to scan
- `output` (string): Output path for generated registry.json

**Returns:** Promise<void>

**Example:**
```typescript
import { generateRegistry } from 'shadcn-vue-registry'

await generateRegistry('./components', './registry')
```

---

## 🔧 Configuration

The tool supports various configuration options:

### Supported File Types

- `.vue` - Vue Single File Components
- `.ts` - TypeScript files
- `.tsx` - TypeScript JSX files
- `.js` - JavaScript files
- `.jsx` - JavaScript JSX files

### Dependency Detection

The CLI automatically categorizes dependencies into:
- **Production dependencies** - Required for runtime
- **Development dependencies** - Required for development
- **Registry dependencies** - References to other registry components

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all CI checks pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Special thanks to [shadcn-vue](https://shadcn-vue.com) for the amazing component library
- Inspired by the shadcn/ui registry system
- Built with ❤️ for the Vue.js community

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/ScaffoldCore/shadcn-vue-registry/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/ScaffoldCore/shadcn-vue-registry/discussions)

---

## 🔗 Related Links

- [shadcn-vue Documentation](https://shadcn-vue.com)
- [Vue.js Official Website](https://vuejs.org)
- [TypeScript Documentation](https://www.typescriptlang.org)

---

**⭐ Star this repo if it helped you!**
