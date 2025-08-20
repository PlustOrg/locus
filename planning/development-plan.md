# Locus Development Plan: A Guide for LLM Implementation

**Objective:** This document outlines a comprehensive, step-by-step plan to build the Locus language and its integrated toolchain from scratch. It is intended to be executed by a Large Language Model (LLM) developer. The goal is to build a robust and feature-complete version of Locus as described in the documentation, prioritizing a logical development order to ensure a stable foundation for subsequent features.

**Core Philosophy: Test-Driven Development (TDD):** You are to follow a strict TDD workflow. For every new feature of the compiler, you must first write failing tests that define the desired functionality. Only after the tests are written and failing should you write the implementation code to make them pass. This ensures correctness and robustness at every stage.

---

## Meta-Instructions for the LLM Developer

### 1. Your Mission
Your mission is to build the Locus compiler and CLI tool. This tool will be a source-to-source compiler, written in TypeScript, that reads `.locus` files and generates a full-stack web application (Next.js frontend, Express.js backend).

### 2. Compiler Project Setup
Before starting, you must set up the development environment for the Locus compiler itself.

*   **Language:** TypeScript
*   **Package Manager:** `npm` or `yarn`
*   **Testing Framework:** Jest (recommended for its mocking capabilities)
*   **Parsing Library:** `chevrotain` (recommended for its performance and features for building robust parsers)
*   **CLI Framework:** `commander.js` (recommended for its simplicity)

**Action:** Create a new TypeScript project. Initialize `npm`, install the dependencies above, and configure `tsconfig.json` and `jest.config.js`.

### 3. Suggested Compiler Project Structure
Organize the compiler's own source code as follows:

```
locus-compiler/
├── src/
│   ├── ast/         # TypeScript interfaces for the Abstract Syntax Tree nodes
│   ├── cli/         # Logic for each CLI command (dev, build, db, etc.)
│   ├── generator/   # Code generation logic (to Prisma, React, Express)
│   ├── parser/      # The core parser (grammar, lexer, etc.)
│   └── index.ts     # Main entry point for the CLI
├── tests/
│   ├── generator/   # Tests for each code generator
│   └── parser/      # Tests for each part of the parser
└── Locus.toml       # (The compiler will generate this for user projects)
```

### 4. How to Use This Plan
Follow the phases and steps in order. Do not proceed to the next step until the tests for the current step are all passing. Each step builds upon the last. References to documentation are provided for context on the *target* language you are building.

---

## Phase 1: Core Language Parsing (TDD)

**Objective:** To build a parser that can read any `.locus` file, understand its contents, and produce a unified Abstract Syntax Tree (AST).

### Step 1.1: Test and Implement the Parser for `database` blocks
*   **TDD:** In `tests/parser/database.test.ts`, write tests that provide `.locus` file content as a string and assert that the correct AST is produced.
*   **Test Cases:**
    *   A single `database` block with one entity.
    *   An entity with all field types (`String`, `Text`, `Integer`, etc.).
    *   An entity with all attributes (`?`, `(unique)`, `(default: ...)`).
    *   An entity with all relationship types (`has_many`, `belongs_to`, `has_one`).
    *   A file with multiple `database` blocks.
    *   Invalid syntax should throw a parsing error.
*   **Implementation:** In `src/parser/`, implement the lexer and parser grammar using `chevrotain` to make the tests pass. Define the corresponding AST node interfaces in `src/ast/`.
*   **Relevant Documentation:** [`language/entities.md`](./language/entities.md)

### Step 1.2: Test and Implement the Parser for `design_system` blocks
*   **TDD:** In `tests/parser/design_system.test.ts`, write tests for parsing `design_system` blocks.
*   **Test Cases:**
    *   A `design_system` block with `colors`, `typography`, `spacing`, etc.
    *   Nested blocks for themes like `light` and `dark`.
    *   A file with multiple `design_system` blocks.
*   **Implementation:** Extend the parser and AST interfaces to support `design_system` blocks.
*   **Relevant Documentation:** [`design-system/theming.md`](./design-system/theming.md)

### Step 1.3: Test and Implement the Parser for `page`, `component`, and `store` blocks
*   **TDD:** In `tests/parser/features.test.ts`, write tests for parsing the application logic blocks.
*   **Test Cases:**
    *   A `page` with `state`, `on load`, `action`, and `ui` blocks.
    *   A `component` with a `param` block.
    *   A `store` with state variables.
    *   The `ui` block with HTML-like tags, attributes, and expressions.
*   **Implementation:** Extend the parser and AST to support these blocks. This will be the most complex part of the parser.
*   **Relevant Documentation:** [`language/features.md`](./language/features.md), [`language/ui-syntax.md`](./language/ui-syntax.md)

### Step 1.4: Test and Implement AST Merging
*   **TDD:** In `tests/parser/merging.test.ts`, write tests for the logic that merges definitions from multiple files and blocks.
*   **Test Cases:**
    *   Two `.locus` files each with a `database` block. The final AST should contain entities from both.
    *   Two `design_system` blocks. The final AST should contain a merged set of design tokens.
    *   Defining the same entity twice should throw a validation error.
*   **Implementation:** Create a new module, e.g., `src/parser/merger.ts`, that takes the raw ASTs from multiple files and produces a single, validated, and unified AST for the entire project.

---

## Phase 2: Code Generation (TDD)

**Objective:** To take the unified AST and generate a working, full-stack TypeScript project.

### Step 2.1: Test and Implement Prisma Schema Generation
*   **TDD:** In `tests/generator/prisma.test.ts`, write tests for the Prisma schema generator.
*   **Test Cases:**
    *   Provide a merged `database` AST and assert that the correct `schema.prisma` file content (as a string) is generated.
    *   Test that Locus types map correctly to Prisma types.
    *   Test that Locus relationships map correctly to Prisma relations.
*   **Implementation:** Create `src/generator/prisma.ts`. This module will contain a function that accepts the `database` part of the AST and returns the schema string.
*   **Relevant Documentation:** [`language/entities.md`](./language/entities.md)

### Step 2.2: Test and Implement Frontend Component Generation
*   **TDD:** In `tests/generator/react.test.ts`, write tests for the React/Next.js component generator.
*   **Test Cases:**
    *   Given a `page` AST, assert that a React component file string is generated.
    *   Assert that the `state` block becomes `useState` hooks.
    *   Assert that the `ui` block becomes JSX.
    *   Assert that `action` blocks become functions inside the component.
    *   Assert that `on load` code is placed inside a `useEffect` hook.
*   **Implementation:** Create `src/generator/react.ts`. This will be a complex module that recursively transforms UI AST nodes into JSX strings.
*   **Relevant Documentation:** [`language/features.md`](./language/features.md), [`language/ui-syntax.md`](./language/ui-syntax.md)

### Step 2.3: Test and Implement Backend API Generation
*   **TDD:** In `tests/generator/express.test.ts`, write tests for the Express.js API generator.
*   **Test Cases:**
    *   Assert that for each data function (`find`, `create`, etc.), a corresponding Express route file is generated.
    *   Assert that the generated route handlers correctly use the Prisma client.
*   **Implementation:** Create `src/generator/express.ts` to generate the backend API routes.

---

## Phase 3: CLI and Toolchain Integration (TDD)

**Objective:** To wrap the parser and generator in a powerful CLI tool.

### Step 3.1: Test and Implement `locus db migrate` and `locus db studio`
*   **TDD:** In `tests/cli/db.test.ts`, write tests for the `db` commands. You will need to use Jest's mocking capabilities to mock the `child_process` module.
*   **Test Cases:**
    *   Assert that `locus db migrate` calls the `prisma migrate dev` command as a child process.
    *   Assert that `locus db studio` calls the `prisma studio` command.
*   **Implementation:** In `src/cli/`, create the command definitions using `commander.js` and implement the logic to invoke Prisma.
*   **Relevant Documentation:** [`toolchain/cli-commands.md`](./toolchain/cli-commands.md)

### Step 3.2: Test and Implement `locus build`
*   **TDD:** In `tests/cli/build.test.ts`, test the full build pipeline.
*   **Test Cases:**
    *   Given a fixture directory of `.locus` files, assert that a full `generated` directory is created with the expected `schema.prisma`, React components, and Express routes.
*   **Implementation:** Create the `build` command logic that orchestrates the entire process: find files -> parse -> merge -> generate all outputs.

### Step 3.3: Implement `locus dev`
*   **TDD:** This is the most difficult to test directly. Focus on testing the sub-parts.
*   **Test Cases:**
    *   Test the file watcher utility to ensure it detects changes in `.locus` files.
    *   Test the incremental re-compilation logic.
*   **Implementation:** Implement the `dev` command. It should run an initial `build`, then use a file watcher (like `chokidar`) to listen for changes and re-run the relevant parts of the build pipeline. It should also start the Next.js and Express dev servers as child processes.
*   **Relevant Documentation:** [`toolchain/development-workflow.md`](./toolchain/development-workflow.md)

---

## Phase 4 & 5: Advanced Features and Extensibility (TDD)

For all subsequent features, continue to follow the TDD methodology.

*   **Data Binding (`bind:value`):** First, write a test in `tests/generator/react.test.ts` for a component that uses `bind:value`, and assert that the generated JSX includes the correct `value` and `onChange` props. Then, implement the logic.
*   **Control Flow (`<if>`, `for:each`):** Write tests asserting that these tags generate the correct conditional rendering and `.map()` loops in JSX. Then, implement.
*   **Testing (`locus test`):** Write tests for the test discovery and runner logic. Then, implement the `test` command.
*   **Plugins (`locus generate from`):** Write tests for the blueprint generator, mocking network requests to Git repositories. Assert that files are correctly templated and copied. Then, implement the `generate` command.

By following this rigorous, test-driven plan, you will build a high-quality, robust, and correct implementation of the Locus language and toolchain.

