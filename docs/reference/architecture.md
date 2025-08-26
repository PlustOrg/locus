# Compiler Architecture

The Locus compiler is a source-to-source compiler. This means it takes your high-level `.locus` files as input and transpiles them into standard, human-readable code (like TypeScript, Prisma, and CSS) that can be run anywhere.

The compilation process is a pipeline with four main stages.

## The Compilation Pipeline

The core of the compiler is a pipeline that processes your code in a series of sequential steps:

```
[ .locus files ] -> Parse -> [ ASTs ] -> Merge -> [ Unified AST ] -> Validate -> [ Validated AST ] -> Generate -> [ Output Files ]
```

### 1. Parse
The compiler begins by finding all `.locus` files in your source directory. Each file is read and parsed individually into an **Abstract Syntax Tree (AST)**. An AST is a tree-like data structure that represents your code in a way that's easy for a program to understand. This stage is responsible for understanding the syntax of the Locus language.

*(See: `src/parser/`)*

### 2. Merge
After all files are parsed into individual ASTs, they are merged into a single, **Unified AST**. This tree represents your entire application. For example, `database` blocks from multiple files are combined into a single database schema, and all `page` and `component` definitions are collected.

*(See: `src/parser/merger.ts`)*

### 3. Validate
The Unified AST is then passed through a validation stage. The validator checks for semantic errors that can't be caught by the parser alone. This includes things like:
- Ensuring that relationships between database entities are correctly defined.
- Checking for duplicate field names within an entity.
- Validating the format of design tokens (e.g., ensuring colors are valid hex codes).

If validation fails, the compilation stops and an error is reported to the user.

*(See: `src/validator/validate.ts`)*

### 4. Generate
The final stage is code generation. The compiler walks the valid, Unified AST and passes it to a series of specialized generators. Each generator is responsible for producing a specific type of output file.

The primary generators are:
- **Prisma Generator:** Creates the `schema.prisma` file from your data models.
- **Express Generator:** Creates the backend API server and route files.
- **React Generator:** Creates the Next.js pages and React components.
- **Theme Generator:** Creates the `theme.css` file from your design tokens.

*(See: `src/generator/`)*

## Plugin Integration
The Locus plugin system allows you to hook into this pipeline at every stage. For example, a plugin can:
- Add new ASTs during the `onParseComplete` hook.
- Implement custom validation rules in the `onValidate` hook.
- Modify generated files or add new ones in the `onAfterGenerate` hook.

This makes the compiler highly extensible. See the [Plugin Author's Guide](../guides/plugins.md) for more details.
