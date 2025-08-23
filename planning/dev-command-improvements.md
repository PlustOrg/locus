## Recent Fixes (Aug 22 2025)

Implemented:
- Always emit `tsconfig.json` (build + incremental) even on subsequent dev runs.
- Generated `package.json` now uses `node -r ts-node/register/transpile-only server.ts` for API dev to avoid ESM/extension quirks.
- Express server generator now uses CommonJS `require` for route imports to prevent Node 23 ESM resolution failures for extensionless TS sources.
- Added route-missing hint in dev stderr parsing.
- Ensured incremental builder does not early-return before writing ancillary files (README, tsconfig).

Implemented (Aug 23 2025):
- `--emit-js` flag for both `build` and `dev` commands. Build compiles TS -> JS into `generated/dist`. Dev starts a background `tsc --watch` and runs `dist/server.js` when available.
- Package manager auto-detection (yarn / pnpm / npm) during first dependency install in dev.
- Health (`/healthz`) and readiness (`/readyz`) endpoints added to generated Express server plus a `[locus][api] ready` log line.
- Automatic `prisma generate` during `locus dev` if `prisma/schema.prisma` exists and `@prisma/client` can't be resolved.

Follow-ups / Nice-to-haves:
- Skip spawning `tsc --watch` if already running (PID file) – currently always restarts per dev session.
- Emit type declarations optionally (`--emit-dts`).
- Expose structured readiness JSON including route count & commit hash.
- Add retry/backoff logging for failed prisma generate.
# `locus dev` UX Improvement Checklist

Goal: Provide immediate, clear, and attractive feedback when running `locus dev`, showing:
- What was generated & where
- Which servers started (API / Next) and their URLs
- Active environment variables / ports
- File watching status & how to exit
- Helpful next steps (Prisma client, .env, build flag)

## Assumptions
- API server listens on API_PORT || PORT || 3001 (current logic).
- Next dev (if pages generated) runs at 3000 (default) unless user overrides externally.
- We can detect if pages exist via merged AST meta (already during build) or by checking generated files.
- We avoid heavy runtime detection (no port probing); we trust configured defaults.

## Checklist

1. Detect Generated Capabilities
   - [x] hasPages via build meta; theme via generated/theme.css; prisma via require.resolve; route count via generated/routes

2. Startup Summary Banner
   - [x] Render a boxed / colored banner once (ASCII + chalk)
       - Project/app name
       - API: URL (http://localhost:<apiPort>) and route count
       - Web (Next): URL if present
       - Theme: loaded indicator if theme.css generated
       - Watching: glob summary (e.g. `**/*.locus`)
       - Commands hint: (press Ctrl+C to stop)
       - Prisma hint if @prisma/client missing (best-effort require.resolve)

3. Structured Logging Conventions
   - [x] Prefixed startup lines; existing rebuild logs already prefixed.
   - [ ] Provide `--quiet` (future) placeholder but do not implement now (document only).

4. Color & Formatting
   - [x] Chalk coloring, ASCII box (no external boxen dependency)

5. Server Spawn Feedback
   - [x] Startup status lines + up/exited messages (spinner skipped as non-essential)

6. Environment Variable Echo
   - [x] Display effective API port, CORS flag, NODE_ENV

7. Incremental Rebuild Notifications
   - [x] Existing regenerated lines preserved
   - [x] Enhanced timing with batch/total/dt when LOCUS_DEBUG=1

8. Graceful Shutdown Messaging
   - [x] Shutdown + bye messages

9. Test Coverage
   - [x] Banner with Web line
   - [x] Banner without Web line
   - [x] Prisma hint when client missing

10. Documentation Update
   - [x] Update `docs/toolchain/cli.md` dev command section (banner + legend)

11. Non-goals (defer)
   - Dynamic port detection / collision resolution
   - Rich spinner animation (if needed later)

## Implementation Plan (Ordered)
1. Extend `buildProject` return to include meta.hasPages so dev can reuse without filesystem scanning.
2. Modify `dev.ts` to capture meta from the initial build.
3. Add helper `formatDevBanner(info)` returning string.
4. Detect prisma client presence with try/catch require.resolve.
5. Integrate banner after initial build & before watcher start.
6. Add process event handlers for child exits to print status lines.
7. Add shutdown messaging.
8. Write tests (mock spawn, capture stdout).
9. Update docs.

## Data Shape for Banner
```
interface DevBannerInfo {
  appName: string;
  apiPort: number;
  hasPages: boolean;
  nextPort?: number;
  theme: boolean;
  prismaClient: boolean;
  enableCors: boolean;
  watchPattern: string;
  routeCount: number; // from generated routes files count
}
```

## Sample Banner (Plain ASCII)
```
┌──────────────── Locus Dev ────────────────┐
│ App: my-app                               │
│ API:  http://localhost:3001  (routes: 3)  │
│ Web:  http://localhost:3000               │
│ Theme: ✓   Prisma Client: ✗ (run prisma generate)
│ Watching: **/*.locus                      │
│ CORS: off  NODE_ENV: development          │
│                                           │
│ Ctrl+C to stop                            │
└───────────────────────────────────────────┘
```

End.
