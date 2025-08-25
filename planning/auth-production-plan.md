# Authentication Production Readiness Plan

Status Date: 2025-08-25
Current Version: 0.4.0
Owner: (assign)

## 1. Executive Summary
The current authentication feature provides a minimal adapter-based middleware, simple JWT helpers (HMAC + exp), page guard syntax, and scaffolding. It is suitable for prototypes and internal tools but **NOT production-grade** for internet-facing applications without additional hardening. Core missing pieces include robust claim validation, refresh/rotation strategy, route-level guard wiring, CSRF protection guidance for cookie use, rate limiting, secure password handling, and observability.

## 2. Current Capabilities
- Adapter injection via `[auth]` in `Locus.toml` (adapter, jwtSecret, requireAuth)
- Express middleware sets `req.auth`, `req.user`, enforces `requireAuth` (global)
- `requireRole` helper (supplied by adapter) + generated guard route stubs
- Page guard syntax: `page Name(guard: role)` captured in AST
- JWT utilities: `generateToken(payload,{expSeconds})`, `verifyToken(token)` with expiration check
- Docs: adapter pattern, threat highlights, security table
- `locus new` generates sample adapter & commented config
- Basic benchmark script (`bench_auth.ts`)

## 3. Key Gaps / Risks
| Area | Gap | Risk | Priority |
|------|-----|------|----------|
| JWT Claims | No iss / aud / sub / nbf / iat validation | Token replay / misuse across services | High |
| Key Mgmt | Single static HMAC secret, no rotation, no kid | Difficult emergency rotation | High |
| Refresh Sessions | No refresh token or sliding session support | Forced frequent logins or long-lived risky tokens | High |
| Revocation | No blacklist / version counter | Cannot revoke compromised token | High |
| Password Handling | Docs example uses fake hash; no plugin guidance | Developers may deploy weak hashing | High |
| Guards | Guard only generates comment + stub endpoint; not tied to actual page delivery | False sense of protection | High |
| CSRF | No guidance for cookie-based sessions; no double submit / SameSite defaults | CSRF attacks possible | High |
| Brute Force / Rate Limit | No middleware or guidance | Credential stuffing risk | Medium |
| Adapter Type Safety | No exported TS interface / ambient types for `req.auth` | Runtime errors, DX friction | Medium |
| Error Handling | Generic 500 on auth failures; no structured error codes | Poor observability / debugging | Medium |
| Logging / Auditing | No auth event logging hook | Incident response difficulty | Medium |
| Observability | No metrics (latency, auth failures) | Cannot tune performance | Low |
| Clock Skew | Exp check only; no leeway or configurable skew | Edge-case early expiry | Low |
| Multi-Tenancy | No tenant claim support | Hard to isolate tenants | Low |

## 4. Production Readiness Criteria
A. Security: Robust token claims, rotation, revocation, strong password hashing guidance.
B. Correctness: Guard annotations enforce route-level access consistently across generated API + (future) Next app.
C. DX: First-class TypeScript types, CLI scaffold options, clear error messages, test utilities.
D. Observability: Basic metrics + structured logs + benchmark baseline.
E. Documentation: Threat model, migration guides, recommended deployment patterns (cookies vs Authorization header).

## 5. Phased Roadmap
### Phase 1: Core Security Hardening (High Priority)
1. JWT claim support (iss, aud, sub, iat, nbf) with validation config in `Locus.toml`.
2. Key rotation: support multiple secrets via `jwtSecrets = ["k1", "k2"]` with active `kid`; embed `kid` in token header.
3. Revocation strategy: optional `sessionVersion` claim + in-memory/user table version check hook (adapter method `isRevoked(claims)`).
4. Password hashing guidance & plugin blueprint: Argon2/bcrypt integration example + CLI flag to scaffold secure adapter.
5. Clock skew window setting (`auth.clockSkewSeconds`, default 60) for exp/nbf checks.

### Phase 2: Guard Enforcement & Access Model
1. Generate middleware map tying `page(guard: role)` to actual express routes (and Next middleware placeholder if pages emitted).
2. Option to declare roles matrix in `Locus.toml` `[auth.roles]` for validation of unknown roles.
3. Validation errors when guard references missing role or adapter lacks `requireRole` and no fallback.
4. Fine-grained entity/action guards: future syntax e.g. `action submit @role(admin)`.
5. Test suite: guard allow/deny with simulated requests.

### Phase 3: Session & Token Lifecycle
1. Refresh token support (httpOnly cookie) with rotation & replay detection (token family identifier + used flag).
2. Sliding session renewal rules (renew if >50% lifetime consumed).
3. Configurable maximum session length and idle timeout.
4. CLI utility to generate & rotate secret keys (`locus auth rotate-key`).

### Phase 4: Defense-in-Depth
1. Rate limiting example (adapter-provided middleware or integration guidance w/ express-rate-limit). 
2. Brute-force lockout strategy (incremental backoff per username/IP). 
3. CSRF protection guidance + optional scaffold (double-submit token or SameSite strict cookie docs).
4. Optional dependency isolation: run auth adapter in minimal sandbox (future).

### Phase 5: DX & Tooling
1. Type definitions: `types/auth.d.ts` augment Express `Request` interface with `auth`.
2. Test helpers: `createTestAuthContext({ roles: [] })` to simulate sessions.
3. Codegen diagnostics: summary file enumerating guard -> role bindings.
4. CLI: `locus auth doctor` (validates config, keys, adapter exports).
5. LSP hints / schema for `Locus.toml` auth section.

### Phase 6: Observability & Metrics
1. Optional logging hook: adapter may export `onAuthEvent(event)`.
2. Metrics emission (timings, failures, token verifications) to stdout JSON or pluggable sink.
3. Benchmark harness extension comparing middleware cost with/without claims.

### Phase 7: Documentation & Migration
1. Expand guide with: rotation, refresh tokens, choosing cookie vs header.
2. Add threat matrix table and mitigation mapping.
3. Migration guide 0.4.x -> 0.5.0 for new multi-secret format.
4. FAQ section (exp vs idle timeout, stateless vs stateful).

## 6. Configuration Extensions (Draft Schema)
```toml
[auth]
adapter = "./authAdapter.js"
requireAuth = true
jwtSecrets = ["KID1:base64secret==", "KID2:base64secret=="] # Active first by default
issuer = "https://app.example.com"
audience = "locus-app"
clockSkewSeconds = 60
refreshTokenLifetimeSeconds = 1209600 # 14d
accessTokenLifetimeSeconds = 900       # 15m
idleTimeoutSeconds = 3600              # 1h
roles = ["user","admin"]
```

## 7. Testing Matrix
| Area | Tests |
|------|-------|
| Claims | accept valid iss/aud, reject invalid, skew edge cases |
| Rotation | token signed with old kid verifies; removed secret fails |
| Revocation | sessionVersion increment invalidates old tokens |
| Guards | allow/deny matrix; unknown role error |
| Refresh | old refresh token invalid after use (single-use) |
| Rate Limit | exceed threshold returns 429 |
| Password Plugin | hashing & verification success/failure |
| CSRF | token mismatch (if scaffold) rejection |

## 8. Success Metrics
- <5ms p95 auth middleware overhead (benchmark script)
- 100% guard annotations enforced (no stub-only) in integration tests
- 0 critical security lint findings (future security audit script)
- Documentation tasks: all High risk items covered with explicit guidance

## 9. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Increased complexity in build pipeline | Keep auth extensions modular (separate generator chunk) |
| Secret exposure in repo | Enforce warning if jwtSecrets literal looks like base64 prod-length value in git workspace |
| Token bloat (claims) | Optional minimal claim mode via config |

## 10. Timeline (Indicative)
- 0.5.0: Phases 1 & 2
- 0.6.0: Phases 3 & partial 4
- 0.7.0: Remaining 4, 5
- 0.8.0: 6 & 7, stabilization

## 11. Acceptance Checklist (Incremental)
- [ ] JWT claim validation
- [ ] Multi-secret rotation
- [ ] Guard enforcement real (no stub)
- [ ] Role registry validation
- [ ] Refresh token flow
- [ ] Revocation/session version
- [ ] Rate limiting guidance & example
- [ ] Password hashing plugin blueprint
- [ ] Metrics & logging hooks
- [ ] Expanded docs & migration guide

---
Prepared automatically; refine & assign ownership next.

## 12. Master Checklist

### Phase 1: Core Security Hardening
- [ ] Implement JWT claim support (iss, aud, sub, iat, nbf) parsing & validation
- [ ] Add configuration keys for issuer, audience, enforce flags
- [ ] Support multiple JWT secrets with kid header embedding
- [ ] Implement secret rotation selection (active first in array)
- [ ] Provide migration note for jwtSecret -> jwtSecrets
- [ ] Implement sessionVersion / revocation hook `isRevoked`
- [ ] Add clock skew configurable validation (clockSkewSeconds)
- [ ] Add password hashing plugin blueprint (Argon2/bcrypt)
- [ ] Warning if plaintext-like passwords detected in adapter examples

### Phase 2: Guard Enforcement & Access Model
- [ ] Generate real guard middleware for page routes (no stub)
- [ ] Integrate guard enforcement with React/Next routing layer (placeholder logic)
- [ ] Add roles registry in Locus.toml ([auth.roles])
- [ ] Validate unknown guard roles against registry
- [ ] Emit diagnostics when adapter lacks requireRole and guard used
- [ ] Extend syntax for action-level guards (action submit @role(admin))
- [ ] Tests: allow/deny matrix for roles

### Phase 3: Session & Token Lifecycle
- [ ] Implement refresh token issuance & storage (httpOnly cookie)
- [ ] Single-use refresh rotation with replay detection
- [ ] Sliding session renewal rules
- [ ] Configurable lifetime: accessTokenLifetimeSeconds
- [ ] Configurable lifetime: refreshTokenLifetimeSeconds
- [ ] Idle timeout enforcement
- [ ] CLI command `locus auth rotate-key`

### Phase 4: Defense-in-Depth
- [ ] Rate limiting example middleware integration
- [ ] Brute-force lockout (incremental backoff)
- [ ] CSRF protection guidance & optional scaffold generator
- [ ] Optional sandbox execution mode for auth adapter

### Phase 5: DX & Tooling
- [ ] Publish TypeScript declaration augmenting Express Request with auth types
- [ ] Provide test helper `createTestAuthContext`
- [ ] Emit guard summary file (guard-map.json)
- [ ] CLI `locus auth doctor` command
- [ ] Provide JSON schema / LSP hints for auth config

### Phase 6: Observability & Metrics
- [ ] Implement onAuthEvent hook events (login, logout, token_invalid, refresh_rotated)
- [ ] Metrics counters & latency histogram (JSON export)
- [ ] Extend benchmark harness for claim-heavy token perf

### Phase 7: Documentation & Migration
- [ ] Expand guide: rotation & refresh flows diagram
- [ ] Add threat matrix table mapping mitigations
- [ ] Migration guide 0.4.x -> 0.5.0 (multi-secret, claims)
- [ ] FAQ (exp vs idle timeout, cookie vs header)

### Key Gap Mitigations
- [ ] JWT claims completeness (iss/aud/sub/nbf/iat) implemented
- [ ] Key rotation documented & example script
- [ ] Refresh & revocation strategy documented
- [ ] Guard enforcement validated end-to-end
- [ ] CSRF guidance finalized
- [ ] Brute force mitigation described
- [ ] Adapter type safety shipped
- [ ] Structured error codes for auth failures
- [ ] Logging & audit events documented
- [ ] Metrics integration documented

### Configuration Extensions
- [ ] Implement parsing for jwtSecrets array with kid extraction
- [ ] Validate roles list uniqueness
- [ ] Validate lifetimes (non-zero, sane upper bounds)
- [ ] Warn if dev secret appears in production (heuristics)

### Testing Matrix Implementation
- [ ] Claims tests (valid / invalid / skew)
- [ ] Rotation tests (old kid still valid until removed)
- [ ] Revocation tests (sessionVersion bump)
- [ ] Guard allow/deny tests with multiple roles
- [ ] Refresh token single-use & replay detection test
- [ ] Rate limit threshold test (429)
- [ ] Password hashing verification test (Argon2/bcrypt)
- [ ] CSRF token mismatch test (if scaffold enabled)

### Success Metrics Tracking
- [ ] Benchmark script updated to output p95 and p99
- [ ] CI check fails if auth middleware p95 > 5ms (allow override)
- [ ] Guard enforcement coverage metric (number enforced / total guards)
- [ ] Security audit script placeholder passes

### Risks & Mitigations
- [ ] Implement secret pattern linter warning
- [ ] Modularize auth generator to minimize complexity
- [ ] Optional minimal-claims mode toggle

### Acceptance Checklist (Roll-up)
- [ ] JWT claim validation
- [ ] Multi-secret rotation
- [ ] Guard enforcement real
- [ ] Role registry validation
- [ ] Refresh token flow
- [ ] Revocation/session version
- [ ] Rate limiting guidance & example
- [ ] Password hashing plugin blueprint
- [ ] Metrics & logging hooks
- [ ] Expanded docs & migration guide

### Post-Release Follow-ups
- [ ] Gather user feedback on auth ergonomics
- [ ] Evaluate adding OAuth provider adapters in future scope document
- [ ] Schedule security review / penetration test

