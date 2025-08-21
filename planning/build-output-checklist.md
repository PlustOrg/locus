# Build Output Quality Checklist

Objective: Ensure the generated outputs from `locus build` and `locus dev` are correct, runnable, and developer-friendly. This checklist captures gaps and improvements across Prisma, API, React/Next, theme assets, and the dev workflow.

## A. Prisma (schema.prisma and client)

- [ ] Generate or document `prisma generate` step so `@prisma/client` exists at runtime.
- [ ] Optionally run `prisma generate` at the end of `locus build` (behind a flag) and surface errors nicely.
- [ ] Emit a minimal `.env.example` with `DATABASE_URL=` and document usage.
- [ ] Validate belongs_to/has_many shape in `schema.prisma`; consider modeling FK scalar first and relation after (convention).
- [ ] Add snapshot test asserting relation shapes for belongs_to/has_many/has_one.

## B. Express API output

- [ ] Generate a server bootstrap that listens on `process.env.PORT || 3001` (e.g., `server.ts` -> `listen.ts` or add a `listen` block).
- [ ] In dev, start the generated server automatically (current `dev` loads `server.ts` but does not call `listen`).
- [ ] Serve static assets from the generated output (for Next `public` files and theme.css) via `express.static` when appropriate.
- [ ] Remove redundant route declarations (keep only handler definitions).
- [ ] Add request payload validation stubs (Zod/Joi) or a TODO comment per route with pointers.
- [ ] Add CORS option (disabled by default; env flag to enable) and use `express.json()` instead of `body-parser`.

## C. React/Next.js output

- [ ] Ensure `next-app` references to pages resolve correctly; add a `tsconfig.json` inside `next-app` to avoid TS path issues.
- [ ] Place `theme.css` where Next can serve it (copy into `next-app/public/theme.css`) and keep a single import path (`/theme.css`).
- [ ] Consider generating a basic `next.config.js` and `package.json` scaffold inside `next-app` (optional) with scripts to run.
- [ ] Confirm dynamic routing strategy (currently `/name`). Consider `kebab-case` routes and document behavior.
- [ ] Add minimal landing page that links to all generated pages for easy manual smoke testing.

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
