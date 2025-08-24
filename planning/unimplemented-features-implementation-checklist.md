# Unimplemented / Speculative Features Implementation Checklist

Purpose: Break down each speculative feature (from docs-validation-checklist.md) into concrete, verifiable steps from design through release. Status tags: [ ] TODO, [P] Planned draft, [IP] In progress, [Done] Complete, [Blocked] External dependency.

---
## Plugin Lifecycle Hooks (Extended TypeScript Plugin API)
**Goal:** Allow external plugins to hook into parse, validate, generate phases and register custom generators/components.

### 1. Product Definition & Design
- [Done] Enumerate required hook points (implemented: onParseStart, onFileParsed, onParseComplete, onValidate, onBeforeGenerate, onAfterGenerate)
- [Done] Decide synchronous vs async contract (all hooks may return Promise; sequential execution)
- [Done] Define plugin manifest basic schema (name, apiVersion, hooks present)
- [Done] Security decision (same-process; sandbox deferred)
- [Done] Performance timings captured per hook (timings object)

### 2. API Spec & Types
- [Done] Create TypeScript interfaces (LocusPlugin, LocusPluginContext)
- [Done] Context object shape (addWarning, addVirtualAst, writeArtifact)
- [Done] Versioned API namespace (apiVersion=1 supported; others warned)
- [Done] Error handling strategy (errors captured, converted to warnings with plugin name)

### 3. Loader & Discovery
- [Done] Support local plugin list via locus.plugins.js in src root
- [Done] Support node module resolution (@scope/locus-plugin-*)
- [Done] Cache & reuse loaded plugin instances
- [Done] Validate manifest compatibility (apiVersion warnings)

### 4. Execution Engine
- [Done] Insert hook invocations at selected pipeline points
- [Done] Aggregate modifications (virtual AST injection)
- [Done] Conflict resolution (first-wins with warning)
- [Done] Timeouts / cancellation handling (env LOCUS_PLUGIN_TIMEOUT_MS)

### 5. Extensibility: Custom Generators
- [Done] Provide emitFile(path, content, kind?) helper (writeArtifact)
- [Done] Register new output targets (registerGenerator after core generation with ordering guarantee)
- [Done] Document extension points for future generators

### 6. Validation of Plugins
- [Done] Schema validation of manifest
- [Done] Dry-run mode (doctor lists hooks without running full build)
- [Done] Diagnostics summarizing hook execution times (doctor output timings)

### 7. Testing
- [Done] Hook ordering & virtual AST injection test
- [Done] Error isolation test
- [Done] Loader/module resolution test
- [Done] apiVersion invalid + timeout tests
- [Done] Custom generator conflict test
- [Done] Performance regression warning test
- [Done] Snapshot test for custom generator output

### 8. Documentation
- [Done] plugins/typescript-plugins.md updated (lifecycle + context + generators + troubleshooting + extension points)
- [Done] Example minimal plugin repository skeleton
- [Done] Troubleshooting section (timeouts, version mismatch)

### 9. Tooling / CLI
- [Done] `locus plugins list` command
- [Done] `locus plugins doctor` validates plugin health

### 10. Release & Migration
- [Done] Increment minor version (0.2.0)
- [Done] CHANGELOG entry with additive notes

---
## Advanced Authentication Flows (JWT / Session Middleware)
**Goal:** Provide documented integration points for auth without hardcoding frameworks.

### 1. Scope & Design
- [ ] Decide minimal built-in primitives (Auth.isLoggedIn, Auth.currentUser) vs user-supplied adapters
- [ ] Define adapter interface (getSession(req), requireRole(role), issueToken(payload))
- [ ] Determine storage (cookie-based session vs stateless JWT) sample

### 2. Adapter Injection
- [ ] Config extension in Locus.toml (auth.adapter = path)
- [ ] Load adapter file in dev/build (dynamic import)
- [ ] Provide context to generated express routes (req.auth / req.user)

### 3. Guards / Access Control
- [ ] Syntax design for action/page guard (e.g., `guard: isAuthenticated` or `@auth(role="admin")` annotation)
- [ ] Parser extension (annotation tokens) if needed
- [ ] Validation to ensure referenced guards exist in adapter

### 4. Token Utilities (Optional)
- [ ] Built-in helper generateToken / verifyToken wrappers
- [ ] Clock skew & expiration handling

### 5. Express Middleware Generation
- [ ] Insert adapter middleware into generated server.ts
- [ ] Conditional inclusion when auth configured

### 6. Testing
- [ ] Mock adapter test (logged-in vs anonymous) ensures guard blocks
- [ ] JWT roundtrip (issue + verify) scenario
- [ ] Route protection snapshot (middleware present only when configured)

### 7. Documentation
- [ ] guides/authentication.md: Updated with adapter pattern & examples
- [ ] Security notes (store secrets & rotate keys)

### 8. CLI / Tooling
- [ ] `locus new` template optionally scaffolds auth adapter file

### 9. Performance & Security
- [ ] Benchmark middleware overhead
- [ ] Threat model review (token replay, CSRF guidance)

### 10. Release
- [ ] Version bump & CHANGELOG

---
## Deployment Automation Steps
**Goal:** Provide optional automated deployment scaffolding (e.g., container build + env file guidance).

### 1. Scope Definition
- [ ] Target platforms (Docker baseline; optional fly.io / render templates)
- [ ] Decide default artifacts (Dockerfile, docker-compose.yml, Procfile)

### 2. Generator Additions
- [ ] Add deployment template generator gated by config flag
- [ ] Support environment variable interpolation from Locus.toml

### 3. CLI Commands
- [ ] `locus deploy init` (writes templates)
- [ ] `locus deploy build` (runs docker build)
- [ ] `locus deploy push` (optional)

### 4. Config Schema
- [ ] Extend Locus.toml with [deploy] section (registry, image name, port)
- [ ] Validation for required fields on deploy commands

### 5. Testing
- [ ] Unit: template generation correctness
- [ ] Integration: simulate build (docker build --dry-run or mocked)
- [ ] Error handling: missing config / malformed registry

### 6. Docs
- [ ] toolchain/deployment.md updated with new flow
- [ ] Examples for local vs hosted

### 7. Security & Compliance
- [ ] Avoid embedding secrets in generated files
- [ ] Guidance on secret management

### 8. Release
- [ ] Version bump; changelog entry

---
## Complex Theming Inheritance
**Goal:** Allow themes to extend other themes and override token subsets.

### 1. Requirements Gathering
- [ ] Define inheritance syntax (e.g., `theme dark extends base { ... }` or `colors { base: light ... }`)
- [ ] Decide merge precedence & cycle detection strategy

### 2. Grammar Changes
- [ ] Token additions (extends keyword)
- [ ] Parser rule for theme declaration with optional parent

### 3. AST & Merge Logic
- [ ] AST node shape update (parentTheme?, resolved flag)
- [ ] Topological resolution of theme graph
- [ ] Duplicate token conflict detection with precise error messages

### 4. CSS Generation
- [ ] Generate variables per theme including inherited tokens
- [ ] Mark overridden tokens with comment for debugging

### 5. Validation
- [ ] Cycle detection test
- [ ] Override precedence test (child overrides parent only)
- [ ] Missing parent theme error test

### 6. Performance
- [ ] Benchmark additional resolution cost

### 7. Documentation
- [ ] design-system/theming.md: Add inheritance examples & pitfalls

### 8. Migration
- [ ] Backwards compatible (no inheritance still works)

### 9. Release
- [ ] Version bump & changelog

---
## Store Advanced Features (Selectors / Derived State / Middleware)
**Goal:** Expand store semantics for computed values & interception.

### 1. Feature Design
- [ ] Selectors syntax (`selector fullName = first + " " + last`)
- [ ] Derived state recomputation rules (dependencies, memoization)
- [ ] Middleware hooks (beforeAction, afterAction, error)

### 2. Parser & AST
- [ ] Grammar for selector declaration inside store
- [ ] AST nodes (kind: 'selector', deps, expression)
- [ ] Middleware registration syntax (e.g., `middleware logger`)

### 3. Runtime Implementation
- [ ] Dependency graph build from selector expressions
- [ ] Efficient invalidation (dirty set propagation)
- [ ] Middleware chain execution order guarantee

### 4. Type / API Surface
- [ ] Generated code returns getters for selectors
- [ ] Action context passes through middleware

### 5. Validation
- [ ] Detect cyclic selector dependencies
- [ ] Disallow mutation inside selector expressions

### 6. Testing
- [ ] Selector memoization test
- [ ] Middleware ordering test
- [ ] Cycle detection test
- [ ] Performance baseline vs no selectors

### 7. Documentation
- [ ] language/application-logic.md: Add selector & middleware sections
- [ ] Examples of derived state vs action mutation

### 8. Tooling
- [ ] Dev warning for expensive selector (threshold ms)

### 9. Release
- [ ] Version bump & changelog

---
## Security Hardening (Prototype Pollution & Input Sanitization)
**Goal:** Strengthen internal safety against malicious inputs / plugins.

### 1. Threat Enumeration
- [ ] List potential vectors (untrusted plugin, crafted .locus file, path traversal)

### 2. Parser Safeguards
- [ ] Enforce max file size / token count
- [ ] Depth limit on nested UI / expressions

### 3. Data Structure Hardening
- [ ] Replace plain object merges with safe shallow copies
- [ ] Freeze critical AST nodes post-merge
- [ ] Use null-prototype objects for maps

### 4. Plugin Isolation
- [ ] Optional sandbox (vm module) for plugin execution
- [ ] Execution timeouts & memory caps

### 5. Input Sanitization
- [ ] Validate identifier charset stricter (ban control chars)
- [ ] Normalize line endings before hashing

### 6. Logging & Error Hygiene
- [ ] Strip user secrets from error messages
- [ ] Redact environment variables in crash reports

### 7. Testing
- [ ] Fuzz test corpus (random tokens)
- [ ] Prototype pollution attempt test ("__proto__" key)
- [ ] Deep nesting rejection test
- [ ] Timeout enforcement test (mock slow plugin)

### 8. Tooling
- [ ] Security audit script (flags disallowed patterns)

### 9. Documentation
- [ ] Security section listing guarantees & limitations

### 10. Release
- [ ] Version bump & security changelog note

---
## Global Tracking
- [ ] Add progress table to README or planning index
- [ ] Create GitHub issues per feature group automatically
- [ ] Link CI jobs to enable optional test suites (plugin, auth, theme-inheritance)
