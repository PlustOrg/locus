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

- [ ] In `dev` incremental builds, also (re)generate `theme.css` when design_system changes (currently skipped).
- [ ] In `build`, ensure `theme.css` is copied/linked into Next `public` for working imports.

## E. Incremental Dev Loop

- [ ] Update incremental builder to write Next outputs (`next-app/*`) and `theme.css`, not only Prisma/Express/React.
- [ ] Add throttled rebuild logs (optional) to help users see what changed when `--debug` is on.

## F. Output Structure and DX

- [ ] Write a short `generated/README.md` explaining how to run the API and Next app locally.
- [ ] Add `.gitignore` hints for `generated/` and Prisma artifacts in project root docs.
- [ ] Deterministic file ordering is implemented; add a one-line comment header in files to indicate they are auto-generated and should not be modified.

## G. Tests and Smoke Checks

- [ ] Add an e2e smoke test that compiles generated React and Next files (TypeScript transpile-only) to catch simple type errors.
- [ ] Add an API smoke test that boots the generated express app (listen on ephemeral port) and returns 200 for GET collection.
- [ ] Verify `locus dev` continues on generator errors with clear messages (already covered for errors; add generator-specific case).

## H. Documentation

- [ ] Update CLI docs with a short section: "What `locus build` generates" including how to run API and Next outputs.
- [ ] Add a troubleshooting section: Prisma client not generated, port conflicts, missing theme.css.

## I. Nice-to-haves

- [ ] Route naming policy (camelCase vs kebab-case), and optional pluralization toggle.
- [ ] Environment variable integration for database and server ports.
- [ ] Optionally generate OpenAPI (Swagger) spec from entities for the API.
