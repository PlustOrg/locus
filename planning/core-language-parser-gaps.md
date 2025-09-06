# Core Language & Parser Production Gaps

Goal: Address fundamental grammar inconsistencies, type system limitations, and parser architecture issues to create a coherent, production-ready language specification.

Status Legend: P0 Critical (blocker for production) | P1 Important | P2 Nice-to-have | P3 Future

---

## 1. Grammar & Syntax Consistency

### Parser Architecture Issues
- [ ] (P0) Unify parsing strategies: Move UI and workflow parsing from ad-hoc regex to Chevrotain grammar
- [ ] (P0) Generate CST for all language constructs to ensure consistent error spans
- [ ] (P0) Reserve structural keywords (`else`, `elseif`, `guard`, `in`) as explicit tokens instead of using Identifier
- [ ] (P1) Implement unified token stream for all parsers
- [ ] (P1) Add recovery strategies for malformed syntax
- [ ] (P2) Create modular parser architecture for easier extension

### Syntax Inconsistencies  
- [ ] (P0) Remove optional list type parsing (`list of Type?`) - make grammar-level error
- [ ] (P0) Implement proper `style_override {}` block with CSS-ish token pass-through
- [ ] (P1) Standardize two-word constructs: decide on `on_load` vs `on load` and enforce consistently
- [ ] (P1) Normalize attribute syntax: choose between parentheses `(attr)` vs annotations `@attr`
- [ ] (P2) Consider `Type[]` shorthand for `list of Type` with deprecation path
- [ ] (P2) Implement canonical formatter for deterministic whitespace/ordering

### Workflow Grammar Formalization
- [ ] (P0) Create formal trigger DSL grammar: `trigger { on: create(Entity) | update(Entity) | webhook(secret: NAME) }`
- [ ] (P0) Implement structured step grammar replacing raw sections
- [ ] (P0) Add retry configuration schema: `retry { max: Int backoff: fixed|exponential factor: Int delay: Duration }`
- [ ] (P1) Validate step references against available actions/operations
- [ ] (P1) Add deterministic step ID assignment for tracing
- [ ] (P2) Implement step dependency analysis and ordering

## 2. Type System Enhancements

### Primitive Type Coverage
- [ ] (P0) Add missing production primitives: `BigInt`, `Float`, `UUID`, `Email`, `URL`
- [ ] (P0) Map new primitives to generator capabilities (Prisma, validation, React)
- [ ] (P1) Implement type validation for primitive constraints
- [ ] (P2) Add custom type definition capabilities

### Nullable vs Optional Semantics
- [ ] (P0) Clarify distinction: `?` (optional field presence) vs `nullable` (explicit null allowed)
- [ ] (P0) Implement grammar support for `| Null` syntax or `nullable` keyword
- [ ] (P0) Update Prisma generator to properly map nullable vs optional
- [ ] (P1) Add validation rules for incompatible combinations
- [ ] (P1) Update documentation with clear examples and migration guide
- [ ] (P2) Consider backward compatibility for existing `?` usage

### Expression System
- [ ] (P0) Implement formal expression grammar for all `{...}` contexts
- [ ] (P0) Add type checking for UI attribute expressions
- [ ] (P1) Create expression AST for compile-time validation
- [ ] (P1) Implement expression optimization and caching
- [ ] (P2) Add support for custom expression functions
- [ ] (P3) Consider expression debugging capabilities

### Relation System Improvements
- [ ] (P0) Add referential integrity hints: `on_delete: cascade|restrict|set_null`
- [ ] (P0) Implement cross-reference validation for workflow actions
- [ ] (P1) Add relation cardinality validation
- [ ] (P1) Support explicit inverse relation specification
- [ ] (P2) Add relation indexing hints
- [ ] (P2) Implement cascade policy validation

## 3. Error Reporting & Diagnostics

### Error Quality Improvements
- [ ] (P0) Provide precise token spans for all error types via unified CST
- [ ] (P0) Implement multi-token suggestions using Levenshtein distance
- [ ] (P0) Add context-specific error messages for attribute misuse
- [ ] (P1) Include suggested replacement snippets in error metadata
- [ ] (P1) Implement quick-fix suggestions for common errors
- [ ] (P2) Add error correlation across multiple files

### Diagnostic Infrastructure
- [ ] (P0) Implement structured diagnostic format with machine-readable codes
- [ ] (P1) Add diagnostic severity levels (error, warning, info, hint)
- [ ] (P1) Implement diagnostic filtering and suppression
- [ ] (P2) Add diagnostic performance metrics
- [ ] (P2) Create diagnostic aggregation and reporting
- [ ] (P3) Implement IDE integration protocols (LSP)

## 4. Performance & Memory Optimization

### Parser Performance  
- [ ] (P0) Implement incremental parsing with per-block content hashing
- [ ] (P0) Add parallel parsing with worker thread pool
- [ ] (P1) Implement compact AST node representation using numeric enums
- [ ] (P1) Add memory usage monitoring and budgets
- [ ] (P2) Implement AST node pooling for reduced allocations
- [ ] (P2) Add parser performance profiling and optimization

### Compilation Performance
- [ ] (P1) Implement modular CST with cached sub-trees
- [ ] (P1) Add compilation phase parallelization
- [ ] (P2) Implement lazy loading for unused language features
- [ ] (P2) Add compilation result caching
- [ ] (P3) Implement streaming compilation for large projects

## 5. Language Feature Completeness

### Missing Language Constructs
- [ ] (P1) Add namespace/module system for large projects
- [ ] (P1) Implement import/export system for code organization
- [ ] (P2) Add interface/contract definitions
- [ ] (P2) Implement generics system for reusable components
- [ ] (P3) Add macro system for code generation
- [ ] (P3) Implement conditional compilation features

### Advanced Type Features
- [ ] (P2) Add union types beyond nullable
- [ ] (P2) Implement intersection types
- [ ] (P2) Add branded/nominal types
- [ ] (P3) Implement dependent types
- [ ] (P3) Add higher-kinded types

## 6. Validation & Safety

### Compile-time Validation
- [ ] (P0) Implement exhaustive validation for all language constructs
- [ ] (P0) Add cross-reference validation (entities, components, workflows)
- [ ] (P1) Implement unused code detection
- [ ] (P1) Add circular dependency detection
- [ ] (P2) Implement dead code elimination
- [ ] (P2) Add code complexity metrics and warnings

### Runtime Safety
- [ ] (P0) Implement whitelist for default value functions
- [ ] (P0) Add expression evaluation sandboxing
- [ ] (P1) Implement resource usage limits
- [ ] (P1) Add runtime type checking capabilities
- [ ] (P2) Implement bounds checking for arrays/collections
- [ ] (P2) Add overflow protection for numeric operations

## 7. Testing & Quality Assurance

### Parser Testing
- [ ] (P0) Add comprehensive fuzz testing for all grammar rules
- [ ] (P0) Implement property-based testing for parser correctness
- [ ] (P1) Add regression testing for error message quality
- [ ] (P1) Implement parser benchmark suite
- [ ] (P2) Add mutation testing for parser robustness
- [ ] (P2) Implement coverage analysis for grammar rules

### Language Specification Testing
- [ ] (P1) Create comprehensive language specification test suite
- [ ] (P1) Add cross-platform compatibility testing
- [ ] (P2) Implement language conformance testing
- [ ] (P2) Add performance regression testing
- [ ] (P3) Create language evolution testing framework

---

## Implementation Priority

### Phase 1: Core Stability (P0)
1. Unify parsing architecture and fix grammar inconsistencies
2. Implement missing primitive types and nullable/optional semantics
3. Add comprehensive error reporting with precise spans
4. Implement basic performance optimizations

### Phase 2: Feature Completeness (P1)  
1. Complete expression system and type checking
2. Add relation system improvements
3. Implement advanced error diagnostics
4. Add parser performance optimizations

### Phase 3: Advanced Features (P2-P3)
1. Add advanced type system features
2. Implement language modularity features
3. Add comprehensive testing frameworks
4. Implement IDE integration capabilities

---

## Success Criteria

- [ ] All parser tests pass with 100% grammar coverage
- [ ] Error messages provide actionable suggestions with precise locations
- [ ] Parse time <200ms for 50-file projects, memory usage <15MB
- [ ] Type system prevents 95% of runtime type errors
- [ ] Grammar is formally specified and machine-verifiable
- [ ] Language specification has comprehensive test coverage

---

Generated: 2025-09-06