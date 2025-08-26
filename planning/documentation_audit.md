# Locus Documentation Overhaul Plan

This document tracks the comprehensive rewrite and audit of the Locus documentation.

## Phase 1: Core Concepts & Guides

- [ ] **Introduction & Philosophy**: Rewrite `docs/introduction/philosophy.md` and `docs/introduction/language.md`.
    - *Goal*: Ensure it's welcoming, sets the right expectations, and clearly articulates the "why" of Locus.
- [ ] **Getting Started Guide**: Rewrite `docs/guides/getting-started.md`.
    - *Goal*: Create a smooth, step-by-step onboarding experience for a new user. Verify all commands and code samples.
- [ ] **Development Workflow**: Rewrite `docs/toolchain/development-workflow.md`.
    - *Goal*: Explain the typical day-to-day process of a Locus developer.

## Phase 2: Language Reference

- [ ] **Data Modeling**: Audit and rewrite `docs/language/data-modeling.md`.
    - *Goal*: Cross-reference with `src/parser/databaseParser.ts` and `src/validator/`. Ensure all field types, directives (`@id`, `@unique`, relationships), and syntax details are covered.
- [ ] **UI Syntax**: Audit and rewrite `docs/language/ui-syntax.md`.
    - *Goal*: Cross-reference with `src/parser/uiParser.ts`. Document all UI elements, properties, `on` handlers, and control flow (`if/else`, loops).
- [ ] **Application Logic**: Audit and rewrite `docs/language/application-logic.md`.
    - *Goal*: Explain features, services, and other logic constructs. Cross-reference with `src/parser/builders/featuresLegacy.ts` and related files.
- [ ] **Authentication**: Audit and rewrite `docs/guides/authentication.md`.
    - *Goal*: Explain the auth block and guards.

## Phase 3: Toolchain & CLI

- [ ] **CLI Overview**: Rewrite `docs/toolchain/cli.md` to serve as a central hub for all commands.
- [ ] **`locus new`**: Document based on `src/cli/new.ts`.
- [ ] **`locus dev`**: Document based on `src/cli/dev.ts`. Cover the startup banner, incremental generation, and all flags.
- [ ] **`locus build`**: Document based on `src/cli/build.ts`. Cover generated outputs, flags (`--dry-run`, etc.), and determinism.
- [ ] **`locus db`**: Document based on `src/cli/db.ts`. Cover `migrate` and `studio` subcommands.
- [ ] **`locus deploy`**: Document based on `src/cli/deploy.ts`.
- [ ] **`locus plugins`**: Document based on `src/cli/plugins.ts` and `src/plugins/manager.ts`.
- [ ] **`locus add`**: **Move** existing documentation to `planning/docs/add-command.md`.
- [ ] **`locus test`**: **Move** existing documentation to `planning/docs/test-command.md`.

## Phase 4: Advanced Topics

- [ ] **Configuration (`Locus.toml`)**: Create a definitive guide to the `Locus.toml` file.
    - *Goal*: Cross-reference with `src/config/config.ts`. Document all possible sections and keys.
- [ ] **Design System**: Rewrite `docs/design-system/theming.md` and `docs/design-system/styling.md`.
    - *Goal*: Cover design tokens, color palettes, typography, and component styling. Cross-reference with `src/parser/builders/designSystemBuilder.ts` and `src/generator/theme.ts`.
- [ ] **Plugin System**: Rewrite `docs/plugins/*`.
    - *Goal*: Create a comprehensive guide for plugin authors, covering hooks, custom generators, and the plugin manifest. Cross-reference with `src/plugins/manager.ts` and `src/plugins/types.ts`.
- [ ] **Deployment**: Rewrite `docs/toolchain/deployment.md`.
    - *Goal*: Provide clear instructions for different hosting providers.
- [ ] **Architecture Reference**: Rewrite `docs/reference/architecture.md`.
    - *Goal*: Give a high-level overview of the compiler pipeline (Parse -> Merge -> Generate).
- [ ] **Common Errors & Troubleshooting**: Consolidate and update `docs/guides/common-errors.md` and `docs/guides/troubleshooting.md`.
    - *Goal*: Create a practical, user-friendly guide to solving common problems.
