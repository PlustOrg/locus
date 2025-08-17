# Locus Implementation Checklist — Open Items

Last audited: 2025-08-16

Legend: [x] Done [~] Partial • [ ] Planned/Not Implemented

This file tracks only incomplete items and enhancements. Completed items have been removed for focus.

## Dev experience and robustness
- [ ] Dev watcher: recursive file discovery, handle add/unlink/rename events, and debounce rebuilds (currently shallow init + change only)
  - Notes: Extend watcher to watch subdirectories and handle create/delete; batch rapid changes.
- [ ] Real process integration: replace stub scripts (`next:dev`, `api:dev`) with actual Next.js and Express startup wiring
  - Notes: Ensure env propagation and log piping; document prerequisites.
- [ ] Graceful shutdown: handle SIGINT/SIGTERM and forward to child processes; ensure cleanup
- [ ] Cross-platform process spawn compatibility (Windows shells and PATH resolution)

## Diagnostics and observability
- [ ] Precise file/line/column in generator and merger errors using token positions or source maps
- [ ] Structured logs and a `--debug` flag for CLI commands (verbose parsing/merging/generation timings)

## Performance
- [ ] Incremental caching: reuse lexed tokens/CST per file and skip re-parse if unchanged; measure improvement with bench:assert
- [ ] Parallelize generation where safe (per entity/page/component) with a small worker pool

## Language and validation enhancements
- [ ] Strict validation for design_system values (e.g., color hex format, token naming conventions)
- [ ] Feature grammar extensions: richer action signatures, typed stores, and event binding semantics per docs refinements

## Generators
- [ ] Next.js scaffolding: optional app/ directory routing and shared layout support
- [ ] Form controls mapping for bind:* (input/select/textarea) with validation hints
- [ ] Theming: inject design system tokens via CSS variables or context; demonstrate usage in generated components
- [ ] Express validation layer (e.g., Zod/Joi) based on entity schema; sanitize user inputs; consistent error payloads
- [ ] Query API: standardize pagination/filtering/sorting params and defaults (caps and validation)

## Tooling & packaging
- [ ] ESLint + Prettier configuration and CI checks
- [ ] GitHub Actions CI: test matrix (Node versions + OS), include `npm run bench:assert`
- [ ] Publish workflow to npm (semantic versioning, tags), and Conventional Commits
- [ ] Issue/PR templates and CODE_OF_CONDUCT.md/CONTRIBUTING.md

## Documentation
- [ ] Expanded README with end-to-end example and design overview diagram
- [ ] Contributor guide: repository layout, testing strategy, coding standards
- [ ] Troubleshooting section (common parser/generator errors and fixes)

## Testing
- [ ] Incremental builder tests: add/addDir/unlink/unlinkDir cases and error paths
- [ ] Snapshot tests for generated React components and Express routes for stability checks
- [ ] Windows CI run to verify CLI/dev behavior on Windows

