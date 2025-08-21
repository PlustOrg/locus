# Build Output Quality Checklist

Objective: Ensure the generated outputs from `locus build` and `locus dev` are correct, runnable, and developer-friendly. This checklist captures gaps and improvements across Prisma, API, React/Next, theme assets, and the dev workflow.

## A. Prisma (schema.prisma and client)

- [x] Generate or document `prisma generate` step so `@prisma/client` exists at runtime. (Flag `--prisma-generate` + README guidance)
- [x] Optionally run `prisma generate` at the end of `locus build` (behind a flag) and surface errors nicely.
- [x] Emit a minimal `.env.example` with `DATABASE_URL=` and document usage.
- [x] Validate belongs_to/has_many shape in `schema.prisma`; convention: FK scalar first, then relation.
- [x] Add snapshot/regex test asserting relation shapes for belongs_to (see `prisma_relations.test.ts`). (has_many already covered indirectly)

## B. Express API output

- [x] Generate a server bootstrap that listens on `process.env.PORT || 3001` (startServer function).
- [x] In dev, start the generated server automatically (dev now calls startServer()).
- [x] Serve static assets from the generated output (Next public + theme.css) via express.static.
- [x] Remove redundant route declarations (only handlers remain with comments).
- [x] Add request payload validation stubs (TODO(validation) comments per mutating route).
- [x] Add CORS option (ENABLE_CORS env flag) and use express.json().

## C. React/Next.js output

- [x] Ensure `next-app` references to pages resolve correctly; add a `tsconfig.json` inside `next-app` to avoid TS path issues.
- [x] Place `theme.css` where Next can serve it (copy into `next-app/public/theme.css`) with single import path `/theme.css`.
- [x] Generate a basic `next.config.js` inside `next-app`.
- [x] Adopt `kebab-case` routes (CamelCase -> kebab) and implicitly document via code.
- [x] Add minimal landing page that links to all generated pages.

## D. Theme (CSS variables)

- [x] In `dev` incremental builds, (re)generate `theme.css` when design_system changes (handled via unified artifact pipeline).
- [x] In `build`, ensure `theme.css` is copied/linked into Next `public` for working imports.

## E. Incremental Dev Loop

- [x] Update incremental builder to write Next outputs (`next-app/*`) and `theme.css` (shared artifact pipeline already does this).
- [x] Add concise rebuild logs and verbose mode via LOCUS_DEBUG env var.

## F. Output Structure and DX

- [x] Write a short `generated/README.md` explaining how to run the API and Next app locally (expanded content).
- [x] Add `.gitignore` hints for `generated/` and Prisma artifacts in project root docs.
- [x] Deterministic file ordering is implemented; files include auto-generated header already.

## G. Tests and Smoke Checks

- [x] Add a smoke test that ensures generated React and Next files exist (ts_compile_smoke.test.ts).
- [x] Add an API smoke test ensuring server + route generated (api_smoke.test.ts).
- [x] Verify `locus dev` continues on generator errors with clear messages (forced generator error test).

## H. Documentation

- [x] Update CLI docs with a section: build outputs & how to run (already added previously).
- [x] Add a troubleshooting section: Prisma client not generated, port conflicts, missing theme.css (see guides/troubleshooting.md and CLI doc section).

## I. Nice-to-haves

- [x] Route naming policy (kebab-case applied) (documented in CLI docs; future config TBD).
- [x] Optional pluralization toggle (internal option with test; needs user-facing flag later).
- [x] Environment variable integration: API_PORT added (precedence API_PORT > PORT > 3001); DATABASE_URL already via .env.
- [ ] Optionally generate OpenAPI (Swagger) spec from entities for the API. (Deferred)
