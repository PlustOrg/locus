# A Guide to Developing Locus for AI Coding Agents

**Version 1.0**

This document provides the essential context, architecture, workflows, and best practices required to successfully understand, build, and extend the Locus compiler and toolchain. Your primary goal is to maintain the project's core philosophy: **developer-friendliness through extreme clarity and exceptional error reporting.**

## 1. Mission and Core Philosophy

Locus is a compiler and all-in-one CLI for a domain-specific language that unifies the definition of a full-stack web application. It parses `.locus` files describing an application's data, design, and features, and generates a production-ready project.

Important: The project is currently under heavy development, and unused by any users, so you can make small or large changes without worrying about breaking existing functionality. You can make breaking changes without any deprecation, and without any fear of impacting users, since there are none.

**Core Tenets:**

1.  **Clarity is Paramount:** The language syntax and the compiler's output must be simple, predictable, and easy to reason about.
2.  **The Developer Experience is the Product:** Our most important feature is a frictionless development workflow. This includes fast incremental builds, a powerful CLI, and, most importantly, world-class error messages.
3.  **No Silent Failures:** When the user makes a mistake, we must provide a clear, actionable error message that points to the exact file, line, and column. We prefer to fail loudly and helpfully rather than recover silently into an unpredictable state.

## 2. Core Architecture: A High-Level Map

The Locus compiler follows a classic multi-pass pipeline: **Parse → Merge → Validate → Generate**.

### Repository Layout
### Repository Layout

-   `src/`
    -   `index.ts`: **CLI Entry Point.** Uses `commander` to define all `locus` commands. This is the top-level orchestrator.
    -   `cli/`: **Command Implementations.**
        -   `build.ts`: Implements the core compilation pipeline. Catches errors and sends them to the reporter.
        -   `dev.ts`: Implements the file watcher (`chokidar`) and incremental rebuild logic for a fast development loop.
        -   `incremental.ts`: The caching and partial rebuild engine used by `dev.ts`.
        -   `reporter.ts`: **Critical Component.** Responsible for rendering beautiful, human-friendly error messages using `chalk` and `boxen`.
        -   `db.ts`, `deploy.ts`, `new.ts`: Implementations for other CLI commands.
    -   `parser/`: **Language Frontend.** Converts `.locus` source text into a structured AST.
        -   `tokens.ts`: **Token Definitions.** All language keywords and symbols are defined here using `chevrotain`. **Order is critical.**
        -   `databaseParser.ts`: **The Grammar.** Defines the language's structure using a Chevrotain CST parser.
        -   `astBuilder.ts`: **CST-to-AST Converter.** Traverses the Concrete Syntax Tree (CST) from the parser and builds our typed, more abstract `LocusFileAST`.
        -   `merger.ts`: Merges all individual `LocusFileAST`s into a single, `UnifiedAst` for the entire project.
        -   `index.ts`: The public interface for the parser, orchestrating the lexer, parser, and CST-to-AST conversion.
    -   `generator/`: **Code Generators.** Each generator takes the `UnifiedAst` and outputs source code.
        -   `prisma.ts`: Generates `schema.prisma`.
        -   `react.ts`: Generates `.tsx` pages and components.
        -   `express.ts`: Generates Express API routes.
        -   `theme.ts`: Generates CSS custom properties from the design system.
        -   `next.ts`: Generates minimal Next.js scaffolding (optional).
    -   `validator/`: **Semantic Analysis.**
        -   `validate.ts`: Traverses the `UnifiedAst` to find semantic errors (e.g., referencing an undefined entity, type mismatches).
    -   `errors.ts`: **Custom Error Types.** Defines `LocusError` and its subclasses (`PError`, `VError`, etc.) which are essential for our rich error reporting.
-   `tests/`: **Jest Tests.** Contains unit and integration tests covering the entire pipeline.
-   `planning/`: High-level design documents and specifications.

## 3. Development Workflow

### Setup and Tooling

-   The project is written in TypeScript and targets `ES2020` / `commonjs`.
-   **Strict mode is enabled.** Avoid `any` where possible.
-   `esModuleInterop` is enabled, allowing `import chalk from 'chalk'`.

### Key `package.json` Scripts

-   `npm run build`: Compiles the TypeScript source to the `dist/` directory.
-   `npm test`: Runs the entire Jest test suite. **Always run this before committing.**
-   `npm run lint`: Runs ESLint. The `no-console` rule is enabled; use the `reporter` for all user-facing output.
-   `npm run format`: Formats all code with Prettier.

**Golden Rule:** All code, especially generators, must be **deterministic**. Always sort lists and object keys before generating output to ensure stable, snapshot-able tests.

## 4. The Golden Path: How to Add a Language Feature

Follow this checklist precisely to add new features safely and consistently. Let's use the example of adding a `(unique)` attribute to entity fields.

1.  **Define the Syntax in `tokens.ts` and `databaseParser.ts`**
    -   Add the token: `export const Unique = createToken({ name: "Unique", pattern: /unique\b/ });` in `tokens.ts`. Add it to the `AllTokens` array, ensuring keywords come before generic identifiers and `Unknown` remains last.
    -   Update the grammar in `databaseParser.ts`. Find the `fieldAttributeGroup` rule and add an `OR` clause for the `Unique` token (if not present).

2.  **Update the AST and the `astBuilder.ts`**
    -   Modify the AST type definitions to include the new information (e.g., `isUnique: boolean` on a field node).
    -   In `astBuilder.ts`, visit the new part of the CST (`visitAttribute`) and set the `isUnique` flag on the field being built. **Crucially, propagate location info** from the CST token to the AST node so error messages can point to it.

3.  **Implement Validation in `validator/validate.ts`**
    -   Add a new validation rule. For example, check if the `(unique)` attribute is being applied to a supported field type.
    -   If validation fails, `throw new VError(...)` with a clear message and the location information from the AST node.

4.  **Update the Code Generators in `generator/`**
    -   Modify the relevant generator (e.g., `generatePrismaSchema` in `generator/prisma.ts`) to consume the new AST property.
    -   In our example, this would mean adding the `@unique` attribute to the generated Prisma field.

5.  **Write Comprehensive Tests**
    -   **Parser Test:** Add a test case with the new syntax to ensure it parses correctly.
    -   **Error Tests:** Add test cases for syntax errors (e.g., `(uniqeu)`) and ensure the `PError` has the correct message and location.
    -   **Validation Test:** Add a test case for a semantic error (e.g., applying `(unique)` to an unsupported type) and assert that the correct `VError` is thrown.
    -   **Generator Test:** Update or add a snapshot test to verify that the generated output (e.g., `schema.prisma`) is correct.

6.  **Finalize**
    -   Run the full test suite: `npm test`.
    -   Run the linter and formatter: `npm run lint` and `npm run format`.

## 5. Deep Dive: Error Handling and Reporting

This is the most critical subsystem for the Locus developer experience. Your goal is to make errors a helpful guide, not a frustrating roadblock.

### The Philosophy

Every error that originates from user-written `.locus` code must be caught and re-thrown as a subclass of `LocusError`. This custom error class standardizes the information needed by the reporter.

### The Anatomy of a `LocusError`

```typescript
// A simplified representation
```typescript
// A simplified representation (actual implementation uses an options object)
class LocusError extends Error {
    constructor(
        public message: string,
        public filePath?: string,
        public line?: number,
        public column?: number,
        public length?: number, // The length of the highlighted span
        public code: 'lex_error' | 'parse_error' | 'validation_error' | 'merge_error'
    ) {
        super(message);
    }
}
```
```

### The Error Lifecycle: A Concrete Example

1.  **User writes invalid code** in `db.locus`: `entity User { name String }` (missing colon).
2.  The `DatabaseCstParser` in `databaseParser.ts` fails. Chevrotain produces a raw error: `Expecting token of type --> Colon <-- but found --> "String" <--`. The error contains the `String` token, which has location info.
3.  The `parseLocus` function catches this raw error and transforms it into our custom error type: `throw new PError("Expected ':' but found 'String'", 'db.locus', token.startLine, token.startColumn, token.image.length)`.
4.  The `build` command in `cli/build.ts` wraps the `parseLocus` call in a `try...catch` block.
5.  On catching the `PError`, it immediately calls `reporter.reportError(e, fileMap)`.
6.  The `reporter` uses this structured information to render a beautiful, user-friendly message:

    ```
    ┌─ Parse Error: Expected ':' but found 'String' ────────────────┐
    │                                                               │
    │   db.locus:1:21                                               │
    │                                                               │
    │   1 │ entity User { name String }                             │
    │     │                     ^^^^^^                              │
    │                                                               │
    └───────────────────────────────────────────────────────────────┘
    ```

## 6. Best Practices and Conventions

-   **Immutability:** Treat the AST as immutable. Validation and generation should read from it, not modify it.
-   **Pure Functions:** Favor small, deterministic, pure functions. They are easier to reason about and test.
-   **No `console.*`:** Never use `console.log` or `console.error` in the core library. All output must go through the `reporter` or a dedicated logger to keep tests clean.
-   **Path Normalization:** When dealing with file paths in tests, normalize them (`.replace(/\\/g, '/')`) to ensure tests pass on both Windows and POSIX systems.
-   **Token Order:** In `tokens.ts`, the order within `AllTokens` is critical. Keyword tokens (`Entity`, `String`, `Unique`) must be listed **before** generic `Identifier` tokens to be matched correctly. The `Unknown` token must be **last**.
-   **Parser Recovery:** Parser recovery is **disabled** (`recoveryEnabled: false`). This is intentional. It prevents the parser from entering a confusing state and ensures we fail fast with a precise error message at the first sign of trouble.