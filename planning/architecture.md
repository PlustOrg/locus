# Architecture Overview

- Parser: Chevrotain lexer/parser builds CST and AST (`src/parser/`)
- Merger: Unifies multiple ASTs with duplicate checks (`src/parser/merger.ts`)
- Generators: Prisma, Express, React, Theme CSS (`src/generator/`)
- CLI: build/dev/new/db/deploy commands (`src/cli/`)
- Tests: Jest suites across parser, merger, and generators (`tests/`)
