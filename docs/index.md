# Locus Documentation

Welcome—this is the canonical guide to the Locus language, compiler, and tooling. Everything here is written for clarity and fast iteration. If something feels ambiguous, it’s a bug: open an issue or send a PR.

---
## Quick Navigation

### Introduction
- [Language Overview](./introduction/language.md)
- [Philosophy & Core Tenets](./introduction/philosophy.md)

### Getting Started & Guides
- [Getting Started](./guides/getting-started.md)
- [Build Outputs & Generated Files](./guides/build-outputs.md)
- [Authentication](./guides/authentication.md)
- [Data Relationships](./guides/data-relationships.md)
- [Design System Guide](./guides/design-system.md)
- [Plugins & Extensibility Guide](./guides/plugins.md)
- [Troubleshooting](./guides/troubleshooting.md)
 - [Performance & Budgets](./guides/performance.md)
 - [Snippet Validation](./reference/snippet-validation.md)

### Language Reference
- [Data Modeling](./language/data-modeling.md)
- [Application Logic](./language/application-logic.md)
- [UI Syntax](./language/ui-syntax.md)
- [Workflows (Experimental)](./language/workflows.md)
 - [Syntax Conventions](./reference/conventions.md)
 - [UI Lexical Mode & Locations](./guides/ui-lexical-mode.md)

### Toolchain & Operations
- [CLI Reference](./toolchain/cli.md)
- [Development Workflow](./toolchain/development-workflow.md)
- [Deployment](./toolchain/deployment.md)

### Architecture & Internals
- [Architecture Reference](./reference/architecture.md)
- [Configuration Reference](./reference/configuration.md)
- [Compiler Development Plan](./development/development-plan.md)
- [Configuration Schema (JSON)](./reference/locus-config.schema.json)

---
## How to Use This Site

- New to Locus? Start with Getting Started → Data Modeling → UI Syntax.
- Prototyping features? Jump to Application Logic & Workflows (flagged experimental when relevant).
- Designing theme & tokens? Use the Design System Guide (then see UI Syntax for component binding).
- Extending or integrating? Read Plugins & the Architecture Reference.
- Operating in production? See CLI, Development Workflow, and Deployment.

> Experimental modules (like Workflows) clearly mark what’s implemented vs planned so you can adopt them confidently.

---
## Contributing & Feedback

Locus values precise errors and deterministic output. If you encounter unclear wording, missing examples, or discover divergence between docs and behavior, please:
1. Create an issue (include snippet + observed output), or
2. Open a PR with a concise doc patch.

We keep docs testable: many code blocks are parsed in CI. When adding new code snippets, prefer minimal, self-contained examples.

Build boldly; the compiler will tell you when you stray.
