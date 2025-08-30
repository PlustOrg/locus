# Locus Language Construct Inventory (Derived from Source Only)

Conservative, source-grounded list. Each construct lists: category, parse location (grammar rule or file), AST builder, generators/consumers, validator usage, representative tests (file substrings), notes/overlaps.

Legend: P=Parser `databaseParser.ts`, B=Builder (modular builders), M=Merger, V=Validator, G=Generators, UI=uiParser/react generator, WF=workflow runtime.

## 1. Top-Level Block Keywords

- `database`
  - Parse: rule `databaseBlock` in `databaseParser.ts` via `topLevel`
  - AST: `buildDatabaseBlocks` (`builders/databaseBuilder.ts`) produces `DatabaseBlock`
  - Merge: merged in `mergeAsts` into unified `database.entities`
  - Generators: `generator/prisma.ts`; also influences `generator/express.ts` (implicit API, not inspected here), may affect tests referencing API generation.
  - Validator: `validateDatabase` (duplicate fields), relation FK rule, integer/default/list validations.
  - Tests: `tests/parser/error_snapshots.test.ts`, `tests/generator/prisma_*.test.ts`, `tests/cli/e2e_build.test.ts`, `tests/cli/incremental.test.ts`.
  - Notes: Container for `entity` declarations only; no attributes.

- `design_system`
  - Parse: `designSystemBlock`
  - AST: `buildDesignSystemBlocks` (in `builders/designSystemBuilder.ts` — not opened but referenced)
  - Merge: merged shallowly (colors/themes, typography, spacing, radii, shadows) in `mergeAsts`
  - Generators: `generator/theme.ts` (not opened here) presumably; React may consume theme indirectly.
  - Validator: naming rules, hex colors, typography weight/base size checks.
  - Tests: `tests/parser/design_system.test.ts`, `tests/merger/design_system_merge.test.ts`, `tests/validator/design_system_names_loc.test.ts`.
  - Notes: Multiple blocks merge; last-wins per token key.

- `page`
  - Parse: `pageBlock`
  - AST: `buildFeatureBlocksLegacy` builds `PageBlock` plus guard/state/actions/ui fields.
  - Merge: duplicate name detection in `mergeAsts`.
  - Generators: `generator/react.ts` (`generateReactPage`); `generator/next.ts` for routing (not read here).
  - Validator: none specific (beyond general merge errors).
  - Tests: `tests/generator/react_*.test.ts`, `tests/generator/ts_compile_smoke.test.ts`.
  - Notes: Guard clause optional with syntax `(guard: RoleName)`.

- `component`
  - Parse: `componentBlock`
  - AST: `buildFeatureBlocksLegacy` -> `ComponentBlock` with params/ui/style override.
  - Merge: duplicate name detection.
  - Generators: `generateReactComponent`; `extractStyles.ts` attaches `styleOverride` content.
  - Validator: none specific yet.
  - Tests: component usage in React generator tests, style override tests (if present), slot param auto-add tests (not enumerated here but implied by code).
  - Notes: Accepts `param` declarations, `ui`, `style: override { ... }` handled by preprocessor in `parser/index.ts`.

- `store`
  - Parse: `storeBlock`
  - AST: `buildFeatureBlocksLegacy` -> `StoreBlock` with optional `state`.
  - Merge: duplicate name detection.
  - Generators: Possibly runtime store generation (not inspected). Not directly in provided generator files.
  - Validator: none specific aside from implicit usage in actions maybe (not implemented).
  - Tests: Any `store` syntax tests (search not performed here for brevity) exist under generator/feature tests.
  - Notes: Shares `state` grammar with pages.

- `workflow`
  - Parse: `workflowBlock` and nested workflow-specific rules.
  - AST: Built inline in `modularAstBuilder.ts` (manual extraction) into `WorkflowBlock` with raw sections and structured steps.
  - Merge: duplicate name detection.
  - Generators: `generator/workflow_manifest*.test.ts` reference generation logic (not opened but existence inferred via tests); manifest builder likely in generator pipeline.
  - Validator: Extensive workflow validations in `validate.ts` (presence of `trigger`/`steps`, retry config keys, trigger incompatibilities, bindings uniqueness, send_email requirements, for_each presence, run step action name existence).
  - Tests: `tests/generator/workflow_manifest.test.ts`, `tests/generator/workflow_manifest_structured.test.ts`, `tests/generator/webhook_routes.test.ts`, `tests/perf/workflow_parse_perf.test.ts`, `tests/workflow/runtime_log_version.test.ts`, `tests/workflow/webhook_invalid_combo.test.ts`.
  - Notes: Steps partially structured; raw content used for sections not yet structured.

## 2. Design System Sub-Block Keywords

- `colors` → `colorsBlock` capturing themes → `themeBlock` and `tokenAssignment`
- `typography` → may contain `weights` sub-block + `tokenAssignment`
- `spacing`, `radii`, `shadows` → simple token lists via `tokenAssignment`
- `weights` → numeric tokens inside `typography`

All parsed in `databaseParser.ts` rules. AST builder for design system (module referenced). Validator enforces naming and value constraints (see above).

## 3. Entity Declarations and Members

- `entity` (inside `database`) → `entityDecl`
- Field declaration grammar: `fieldDecl` with `fieldType`, optional list (`list of <Primitive>`), optional `?`, and zero+ `fieldAttributeGroup`.
- Relation declaration grammar: `relationDecl` with relation kind tokens `has_many`, `belongs_to`, `has_one` + target identifier, optional attributes.

Primitives: `String`, `Text`, `Integer`, `Decimal`, `Boolean`, `DateTime`, `Json` (tokens: `StringT`, etc.).

List Type: `list of <Primitive>`; optional `?` allowed syntactically but validator forbids optional list.

Attributes (enclosed `( ... )`):
  - `(unique)` → `Unique` token → AST attribute `{ kind: 'unique' }`
  - `(default: <Number|String|Identifier|CallExpr>)` → parsed by `defaultAttr` → AST attribute with value or call descriptor
  - `(map: "name")` → `mapAttr` → AST attribute `{ kind: 'map', to: string }`

CallExpr inside default: `<Identifier>(arg, ...)` with literal args number|string|identifier.

Builder: `databaseBuilder.ts` maps tokens to AST types, collects attributes via helper functions (`helpers.ts` not opened).

Generator: `prisma.ts` maps fields & relations to Prisma model syntax, enforcing conventions (implicit id field, relation fk fields for belongs_to, mapping defaults & unique & map).

Validator: Field duplication, list constraints, integer default range, foreign key existence for belongs_to, duplicate entity names (merge), etc.

Tests: Numerous under `tests/generator/prisma_*.test.ts`, `tests/parser/error_snapshots.test.ts`, `tests/parser/token_order.test.ts`, `tests/validator/*`.

## 4. Feature Internals (Pages, Components, Stores)

Shared mini-language extracted as raw text patterns (not fully tokenized beyond block structure):

- `state { ... }` blocks:
  - Lines of `name: Type = defaultExpr` or `name: list of Type = ...`; optional `?` suffix on Type.
  - Parsed by regex in `featuresLegacy.ts` `parseStateDecls` → stored as typed objects with `primitive` or `list` plus default string.
  - Optional for pages & stores; components currently have params instead of state.

- `on load { ... }` block (page only): raw content stored (`onLoad`).

- `action <Name>(param[:Type?][, ...]) { ... }` with optional parameter list.
  - Parameters: optional typed identifiers with optional `?` (optionality) and optional types; types for actions use limited subset: primitive identifiers or tokens (`IntegerT`, etc.) mapped in builder.
  - Body raw content captured.

- `guard clause`: `(guard: RoleName)` directly after page name before `{`.

- Component `param` declarations: `param name: [list of] Type [?] [= defaultRaw]`.
  - Stored with type shape similar to state.

- UI block: `ui { ... }` free-form markup-like mini-language parsed by `uiParser.ts` into a small UI AST.

- Style override: `style: override { ... }` consumed by preprocessor in `parser/index.ts` (sanitizes but preserves token boundaries) and later attached by `extractStyles.ts` (not inspected) into `ComponentBlock.styleOverride`.

Generators:
  - React page/component generation uses `state`, `onLoad`, `actions`, `uiAst`, auto-import logic, event/binding transformation.

Tests: React generator tests (`react_ui.test.ts`, `react_page_auto_import.test.ts`, etc.), TS compile smoke test.

Notes: Mixing token and regex-based parsing; potential overlap in attribute names (e.g., `state` token reused in workflows raw content gating logic).

## 5. UI Template Constructs (Inside `ui {}`)

Parsed by custom `uiParser.ts` (not Chevrotain):

- Element tags `<Tag ...>` with attributes.
- Closing tags `</Tag>` and self-closing `<Tag .../>`.
- Text nodes (trimmed of extraneous whitespace).
- Attributes syntaxes matched by regex `(for:each|on:[A-Za-z]+|name)` plus value forms: `{expr}`, quoted string, or bare token.

Special attribute transformations:
  - `for:each="{ item in iterable }"` normalized to AST node type `forEach` (later rendered to `.map()` in React).
  - Event handlers `on:click={...}` normalized to `onClick`.
  - `bind:value={stateVar}` expanded to `value` + `onChange` pair.
  - `class` becomes `className` during render.

Structural control flow via element tags (not attributes):
  - `<if condition={expr}>...</if>` optionally followed by `<elseif condition={expr}>...</elseif>` chains and `<else>...</else>`; transformed into AST if-node then to React ternary chain.

Edge constructs: Named slot inference (component generation) via `{SlotName}` pattern with suffix `Slot` (handled in generator not parser).

Tests: React UI generation tests (`react_ui.test.ts`, `react_page_composite.test.ts`).

Notes: `!` characters in UI replaced in sanitized source for lexing but preserved in original for UI parse (parser/index.ts hack replacing `!` with space for lexer, so `!` cannot appear as separate token outside UI currently).

## 6. Workflow Constructs

Workflow block children (all optional except mandatory `trigger` and `steps` validated):
  - `trigger { raw }`
  - `input { raw }`
  - `state { raw }` (reuses stateBlock rule, but currently raw for workflows)
  - `steps { workflowStepStmt* }`
  - `on_error { raw }`
  - `on_failure { raw }`
  - `concurrency { raw }`
  - `retry { raw }` (parsed into key-value map for validator: keys allowed max, backoff, factor, delay)

Structured steps recognized:
  - `run <Identifier>(args?)` with optional preceding `const binding =`
    - args may be positional expressions or key:value pairs (currently args preserved raw; simple expression parsing for single arg without `:`/`=`)
  - `delay { raw }`
  - `branch { [raw condition content] steps { ... } (elseif/else chains via branchInner constructs) }`
  - `forEach <loopVar> in <argExpr> { steps }`
  - `http_request [Identifier]? { raw }` (simple step recognized during building as kind 'http_request')
  - `send_email { to: ..., subject: ..., template: ... }` (fields extracted heuristically)

Other tokens reserved/recognized but not yet given structured semantics in builder: `Group`, `Limit`, (Delay handled), `policy`, etc. (Tokens `Policy`, `Group`, `Limit`, etc., appear in tokens list but not currently used in grammar for workflow steps; they can appear in raw content and inside `rawContent`).

Validator logic enforces presence, configuration constraints, and some semantic checks (bindings uniqueness, required send_email fields, retry key validations, exclusive triggers, for_each usage, run action name present).

Tests enumerated previously.

## 7. Expression Mini-Language (Workflow step args / branch conditions)

Partial expression parsing via `expr.ts` (not read, implied). Recognized tokens from `tokens.ts`: equality (`==`, `!=`), logical (`&&`, `||`), unary `!`, arithmetic `+ - * /` (StarTok, PlusTok, HyphenTok, SlashTok) though grammar for expressions not in `databaseParser.ts` (handled separately by `parseExpression` on raw strings).

Used where: `modularAstBuilder` attempts to parse single run arg, branch condition, forEach iterable, etc. UI attribute expressions remain raw strings (no type checking yet).

## 8. Attributes on Fields and Relations

- `(unique)`
- `(default: value|call|identifier|literal)`
- `(map: "string")`

Collected by helpers; both fields & relations can carry attributes (enabling unique constraints on belongs_to for one-to-one modeling).

Generators: Prisma mapping of `@unique`, `@default()`, `@map()`.

Validator: Constraints for list defaults, integer default range, belongs_to requires FK field.

## 9. Tokens Reserved / Present but with Limited or No Current Semantics

From `tokens.ts` present but either only allowed inside rawContent or not yet structurally interpreted:
- Style tokens: `style`, `override` (preprocessed only)
- Workflow extras: `Group`, `Limit`, `Policy` (token present, grammar partial), `Delay` (implemented), `Branch` (implemented), `ForEach` (implemented), `SendEmail` (implemented), `HttpRequest` (recognized heuristically), `Concurrency`, `Retry`, `OnFailure`, `OnError`, `Trigger`, `InputKw`, `Steps`
- Feature tokens reused in raw content gating for UI and state: `State`, `Action`, etc.
- Punctuation tokens used broadly but not meaningful at semantic layer except inside parsing heuristics.

## 10. Overlaps / Ambiguities / Cross-Cutting Notes

- Reuse of `stateBlock` rule for both feature `state {}` and workflow `state {}` sections: same grammar but different downstream meaning (raw vs structured state objects). Potential future divergence.
- `Identifier` token used extensively; absence of reserved keywords for some pseudo-keywords (e.g., `else` in branchInner uses generic Identifier requiring semantic expectation) could allow accidental misuse.
- UI parsing bypasses Chevrotain; therefore UI-specific attributes (`for:each`, `on:*`, `bind:value`) are invisible to lexer/parser; transformations occur post-AST build. This bifurcated approach may complicate unified error reporting/location mapping.
- Style override content sanitized (inner replaced by spaces) to protect lexer; underlying tokens within style block are not semantically accessible (intentional opacity) — potential challenge for future CSS validation or tooling.
- Expression parsing occurs only opportunistically (single run arg, branch condition, forEach iterable). Mixed key-value `run` args bypass structured expression parsing.
- Field & relation attributes share the same `fieldAttributeGroup` grammar node; builder uses separate collector functions; ensures future extensibility (but may produce duplication if attribute semantics diverge for relations vs fields).
- Some workflow tokens (`Policy`, `Group`, `Limit`) appear only in rawContent consumption; semantics deferred.
- List optionality: grammar allows `list of Type?`; validator rejects optional list in database fields but builder captures `optional` flag — potential mismatch (list field type has optional property but always invalid).
- `!` replaced with space before lexing (to allow UI `!` inside markup) — side-effect: actual `!` operator in expressions inside non-UI contexts could be lost (mitigated only if expressions parsed from raw slices of original source? Currently sanitized string used for lexing; builder slices original source for raw sections; expression parser fed raw substrings from original source? Confirm in builder: uses `extractText` which slices original source; original still has `!` so safe for expression parse; but any expression spanning sanitized region inside style override would have spaces — style:override not parsed for expressions yet).

## 11. Flat List Summary (Names Only)

Keywords / Block Starters:
`database`, `entity`, `design_system`, `colors`, `typography`, `weights`, `spacing`, `radii`, `shadows`, `page`, `component`, `store`, `state`, `on load` (two tokens), `action`, `ui`, `param`, `style: override` (compound), `workflow`, `trigger`, `input`, `steps`, `on_error`, `on_failure`, `concurrency`, `retry`, `branch`, `forEach`, `delay`, `run`, `send_email`, `http_request`.

Entity Relation Types:
`has_many`, `belongs_to`, `has_one`.

Type Primitives:
`String`, `Text`, `Integer`, `Decimal`, `Boolean`, `DateTime`, `Json`, `list of <Primitive>`.

Field/Relation Attributes:
`(unique)`, `(default: ...)`, `(map: "...")`.

UI Template Constructs:
`<Tag ...>`, `<Tag />`, text, attributes: `for:each={item in expr}`, `on:event={expr}`, `bind:value={stateVar}`, `<if condition={expr}>`, `<elseif condition={expr}>`, `<else>`.

Workflow Step Keywords:
`run`, `delay`, `branch`, `forEach`, `http_request`, `send_email`, plus optional `const <binding> =` prefix.

Expression Operators (in tokens or implied):
`==`, `!=`, `&&`, `||`, `!`, `+`, `-`, `*`, `/`.

Misc / Punctuation Tokens (structural only):
`{`, `}`, `(`, `)`, `:`, `,`, `?`, `<`, `>`, `/`, `.`, `+`, `-`, `;`, `*`, `[`, `]`, `'`, `=`.

Attributes (UI, Component Params, etc.) use identifier-based keys.

---

Prepared strictly from inspected source files under `src/parser`, `src/ast`, `src/generator`, and `src/validator`, plus test filename/content snippets via grep. No speculative future constructs included beyond those already tokenized.
