# Style Override Refactor Plan

Goal: Robust support for multiple `style:override` blocks inside components while preserving original CSS and avoiding grammar complexity.

## Checklist (Updated Strategy)

Revised simplification: Entire `style:override { ... }` block is replaced pre-lex with a single placeholder identifier (e.g. `sob0`) so the grammar never processes its braces. This avoids nested brace depth issues. Original CSS captured separately.

- [x] Phase 1: Style block scanner
  - [x] Scan source for component spans (balanced braces)
  - [x] Detect `style:override` start tokens and find matching closing brace (balanced)
  - [x] Record blocks (fullStart, fullEnd, content, index, componentName)
  - [x] Replace entire block region with a single placeholder identifier plus space (no braces retained) to keep component structure valid
  - [x] Handle unmatched (unterminated) blocks by recording partial info

- [x] Phase 2: Parser integration
  - [x] Invoke scanner before lexing
  - [x] Feed transformed source to lexer
  - [ ] Emit `PError` early when an unterminated style block is detected (TODO)
  - [x] Remove previous regex/preprocessing logic

- [x] Phase 3: Grammar simplification
  - [x] Remove style-specific tokens/rules
  - [x] Keep `rawContent` generic

- [x] Phase 4: AST augmentation
  - [x] Attach `styleOverrides` array
  - [x] Provide `styleOverride` (last)
  - [ ] (Optional) Add location metadata (TODO)

- [ ] Phase 5: Testing
  - [ ] Update existing style tests to assert multi-block support & last-wins
  - [ ] Add test for multiple blocks: 2+ style:override blocks
  - [ ] Add malformed (unbalanced) block test expecting parse error (graceful)
  - [ ] Add nested braces inside style block test
  - [ ] Add test for style keyword inside string not starting a block

- [ ] Phase 6: Error handling
  - [ ] Emit `PError` for unmatched style block (scanner depth > 0)
  - [ ] Add test for unterminated block

- [ ] Phase 7: Docs & Changelog
  - [ ] Document multi-block behavior (last wins) & future extension

- [ ] Phase 8: Cleanup
  - [ ] Remove obsolete code paths (regex fallback, placeholder stripping)
  - [ ] Ensure deterministic ordering & no residual debug logging

- [ ] Phase 9: Full test suite run & finalize

## Notes

Approach preserves offsets by length-preserving blanking of CSS internals, avoiding token/source misalignment. Scanner operates before lexing; grammar remains simple and agnostic of CSS structure.
