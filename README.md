# Locus Compiler

Locus is a source-to-source compiler for building full-stack apps from `.locus` files. It parses database, design_system, and feature blocks, merges across files, and generates Prisma schema, Express API routes, and React components.

## Quickstart

- Install deps and run tests

```sh
npm install
npm test
```

- Build a project

```sh
npx locus build --src ./src --out ./generated
```

- Dev mode (watches `.locus` and incrementally rebuilds)

```sh
npx locus dev --src ./src
```

## Docs
- Language: docs/language/
- Toolchain: docs/toolchain/
- Design System: docs/design-system/
- Performance notes: docs/PERF.md

## Benchmarks

```sh
npm run bench:parser
```

Outputs a JSON line with iterations, elapsedMs, tokens, tokensPerSec.
