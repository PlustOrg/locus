# Plugins & Extensibility

Locus is designed to be extensible. You can add new features, integrations, and code templates using plugins. There are two main plugin types:

## 1. TypeScript Plugins

- Deep integration with the compiler and CLI
- Add new CLI commands
- Extend backend API (Express routes)
- Provide custom React components
- Modify build process

See [TypeScript Plugins](./typescript-plugins.md) for authoring details.

## 2. Blueprints

- Shareable feature templates written in Locus
- Stamp out common features (blog, auth, contact form)
- Use `locus generate <blueprint>` to apply

See [Blueprints](./blueprints.md) for creation and usage.

## How to Use Plugins

- Install via npm
- Register in `Locus.toml` under `[plugins]`
- CLI and compiler will auto-load plugins

Plugins empower you to go beyond the built-in capabilities of Locus, integrating with third-party services or sharing reusable code patterns.
