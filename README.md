<div align="center">
  <h1>Locus</h1>
  <p><strong>The Full-Stack App Compiler</strong></p>
  <p>Transform <code>.locus</code> files into complete, production-ready web applications.</p>
</div>

<div align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg" alt="Node.js version">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <a href="https://deepwiki.com/PlustOrg/locus"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</div>

---

Locus is a source-to-source compiler and toolchain for building full-stack web applications with maximum velocity and clarity. Write simple, declarative `.locus` files and generate:

- **Backend API:** Express.js server with RESTful routes
- **Database:** Prisma schema and migrations
- **Frontend UI:** React components and Next.js pages
- **Design System:** Theming and styling via design tokens

## 🚀 Key Features

- **Declarative Syntax:** Define your entire app—data, logic, and UI—in one place
- **Full-Stack Generation:** Prisma, Express, React/Next.js, and CSS from a single source
- **Incremental Builds:** Fast `dev` mode with hot reload and smart rebuilds
- **Helpful Diagnostics:** Clear errors with file, line, and column info
- **Extensible:** Plugin system for custom features and integrations
- **Performance-Focused:** Lightweight parser and efficient codegen

## 📦 How It Works

1. **Parse:** Reads all `.locus` files and builds an AST (Chevrotain)
2. **Merge:** Combines all features, entities, and design tokens into a unified AST
3. **Generate:** Produces deterministic code for database, API, UI, and theme

## 🏁 Quickstart

### Prerequisites
- Node.js (v18 or higher)

### 1. Install the CLI
```bash
npm install -g @plust/locus
```

### 2. Create a New Project
```bash
locus new my-app
cd my-app
```

### 3. Start the Development Server
```bash
locus dev
```

## 🗂️ Generated Project Structure

```
./generated/
├── prisma/
│   └── schema.prisma       # Database schema
├── routes/
│   └── *.ts                # Express routers per entity
├── react/
│   ├── pages/
│   │   └── *.tsx           # React pages
│   └── components/
│       └── *.tsx           # React components
├── theme.css               # Design tokens as CSS variables
└── server.ts               # Express app bootstrap
```

## 🛠️ Command-Line Interface (CLI)

| Command                  | Description                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| `locus new <name>`       | Scaffold a new project with config and sample files                      |
| `locus build`            | Full, deterministic build of the project                                 |
| `locus dev`              | Dev server with hot reload and incremental rebuilds                      |
| `locus db migrate`       | Run Prisma migrations                                                     |
| `locus db studio`        | Launch Prisma Studio for data management                                 |
| `locus deploy`           | Build and deploy to Vercel, Railway, etc.                                |
| `locus plugins list`     | List installed plugins                                                    |
| `locus plugins doctor`   | Diagnose plugin setup and performance                                    |

**Common Flags:**
- `--src <dir>`: Source directory for `.locus` files
- `--out <dir>`: Output directory for generated code
- `--debug`: Detailed timing logs

## ⚙️ Configuration

- Project settings: `Locus.toml`
- Design tokens: `design_system { ... }` blocks in `.locus` files

## 🧑‍💻 Development & Contributing

  1. Fork and clone the repo
  2. Install dependencies: `npm install`
  3. Run tests: `npm test`
  4. Add features with tests and docs

  ### Parser Guard Tests
  The grammar and primitive mappings are protected by hash tests (`grammar_rule_names.test.ts`, `primitives_hash.test.ts`). If you intentionally change the grammar or primitive token set, update the expected hash in those tests with a clear commit message.

  Parser utilities live in `src/parser` (`primitiveTypes.ts`, `stateHelpers.ts`, `workflowBuilder.ts`, `uploadBuilder.ts`). These helpers are pure; avoid hidden side-effects to keep parsing deterministic.

## 📚 Documentation

- [Introduction & Philosophy](docs/introduction/language.md)
Key checklists:
- Security: `docs/guides/security-checklist.md`
- Production Readiness (draft): `docs/reference/production-readiness-checklist.md`
- [Language Reference](docs/language/data-modeling.md)
- [Application Logic](docs/language/application-logic.md)
- [UI Syntax](docs/language/ui-syntax.md)
- [Design System](docs/design-system/theming.md)
- [Toolchain & CLI](docs/toolchain/cli.md)
- [Development Workflow](docs/toolchain/development-workflow.md)
- [Deployment](docs/toolchain/deployment.md)
- [Plugins & Extensibility](docs/plugins/index.md)
- [Architecture](docs/reference/architecture.md)

Active initiative: Documentation overhaul (label: `docs-overhaul`). See planning checklist at `planning/overhaul/docs-overhaul-checklist.md`.

## 📝 License

MIT. See the `LICENSE` file for details.


