# Compiler Architecture

The Locus compiler is a source-to-source compiler that transforms `.locus` files into a full-stack web application. The compilation process is divided into several stages, each with a distinct responsibility.

## 1. Parsing

The first stage is parsing. The compiler reads all `.locus` files in the source directory and parses them into an Abstract Syntax Tree (AST). This is done by the `parseLocus` function in `src/parser/index.ts`. The AST represents the structure of the code in a way that is easy for the compiler to understand.

## 2. Merging

After parsing, the individual ASTs are merged into a single, unified AST. This is handled by the `mergeAsts` function in `src/parser/merger.ts`. The merged AST represents the entire application in a single tree.

## 3. Validation

The merged AST is then validated to ensure that it is well-formed and that it follows the rules of the Locus language. The `validateUnifiedAst` function in `src/validator/validate.ts` is responsible for this.

## 4. Code Generation

The final stage is code generation. The compiler walks the validated AST and generates the output code. The `src/generator/` directory contains the code generators for the different parts of the application:

-   `prisma.ts`: Generates the Prisma schema for the database.
-   `express.ts`: Generates the Express.js API for the backend.
-   `react.ts`: Generates the React components and pages for the frontend.
-   `next.ts`: Generates the Next.js application shell.
-   `theme.ts`: Generates CSS variables for theming.

The generated code is written to the output directory, which is specified by the `--out` flag of the `build` command.
