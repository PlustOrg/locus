# Generator Architecture (Post-Refactor Overview)

This document summarizes the structure of the `src/generator/` subsystem after the modular refactor.

## Step Pipeline
Generation is orchestrated by `runPipeline` (`src/generator/pipeline.ts`). All work is performed by ordered `GeneratorStep`s exported from `src/generator/steps/index.ts`:

1. `legacy-optional-warning` – optional warnings based on env flag.
2. `react-runtime` – copies runtime support files into `react/runtime/` with `// @ts-nocheck` banner.
3. `workflows-manifest` – emits structured JSON for each workflow.
4. `prisma` – emits `prisma/schema.prisma` and `.env.example`.
5. `express` – generates REST routes + `server.ts` bootstrap (internally now split into pure helpers).
6. `react-components` – emits React component `.tsx` files; supports dead code elimination via `LOCUS_DEAD_CODE=1`.
7. `react-pages` – emits page components referencing component list.
8. `theme` – optional CSS custom properties (controlled by `includeTheme`).
9. `next` – optional Next.js scaffold (controlled by `includeNext`).
10. `warnings-summary` – structured + text warning outputs.
11. `manifest` – deterministic build manifest (stable hash used by tests).

`LOCUS_PARALLEL_GEN=1` groups compatible steps into phases while preserving ordering constraints.

## Shared Utilities
`_shared.ts` supplies small pure helpers (`sortByName`, `pluralize`, `kebabCasePageName`, `stableJSONString`). Additional focused helpers live near their domains (e.g. `expandMimeList` in `uploads.ts`).

## Express Generator Decomposition
`express.ts` now exports helpers:
- `buildEntityRouteModule`
- `buildServerBootstrap`
- `buildAuthUtils`

They produce byte-identical output to legacy inline logic. A dedicated snapshot-hash test guards against regressions.

## React Generator Separation
- `reactTransforms.ts` contains UI transformation and AST rendering.
- `uiAstTypes.ts` centralizes type definitions.
- `react.ts` focuses on page/component code emission only.

## Validation Generation
Logic for building validation schemas moved into `validationRules.ts` (`ruleFromField`, `applyConstraints`, `cloneAllOptional`). Output verified via SHA-256 hash parity test.

## Upload Policies
Wildcard MIME expansion isolated in `expandMimeList`. Test ensures uniqueness & stability of expanded MIME types.

## Stability & Determinism
- `stabilizeContent` normalizes volatile substrings (timestamps, ports, temp paths) before hashing where used.
- `generator_output_hash_stability.test.ts` asserts aggregate output hash remains unchanged for a representative project.
- Dedicated tests exist for theme generation order, Next presence, Express route formatting, validation schema, and upload wildcard expansion.

## Environment Flags
- `LOCUS_DEAD_CODE=1`: Eliminates unreachable React components (warnings produced).
- `LOCUS_PARALLEL_GEN=1`: Enables phased parallel generation.
- `LOCUS_BUILD_CACHE=1`: Caches pipeline outputs keyed by serialized unified AST.
- `LOCUS_WARN_LEGACY_OPTIONAL=1`: Emits warnings for legacy optional field usage.
- `LOCUS_VALIDATION_JIT=1`: Switches runtime validation to JIT mode.

## Future Opportunities (Not Implemented Here)
- Template-driven code emission for Express/React to further improve readability.
- Configurable formatting pipeline (Prettier on generated artifacts).
- Fine-grained incremental invalidation keyed by AST segment hashes.

---
This architecture aims for clarity, separation of concerns, and robust deterministic outputs with comprehensive test coverage safeguarding each refactor.
