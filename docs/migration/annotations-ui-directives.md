# Migration Guide: Annotations & UI Directives

This guide outlines changes when moving to the annotation (`@attr`) model and directive-based UI control flow.

## Attribute Annotations
Legacy form:
```
entity User { name: String (unique) }
```
New form:
```
entity User { name: String @unique }
```
Deprecation warnings include a removal version. Update all `(attr)` usages.

## Relation Policies
Legacy:
```
belongs_to user User (policy: cascade)
```
New:
```
belongs_to user User @policy(cascade)
```

## UI Control Flow
Legacy element chains:
```
<if condition={cond}>A<elseif condition={b}>B<else>C</if>
```
New directive form (supported now alongside elements):
```
{#if cond}A{:elseif b}B{:else}C{/if}
```
Both parse equivalently; element form may be deprecated later.

## Action Steps
Ensure loops use explicit `forEach item in items { ... }` form. Legacy inline forms emit warnings.

## Recommended Process
1. Run `locus build` and capture deprecation warnings.
2. Replace parentheses attributes first (search for `(` following a type declaration).
3. Convert relation policy annotations.
4. Update UI conditionals to directive syntax where preferred.
5. Re-run `locus build --suppress-warnings` to confirm clean output.

## Tooling
Future: an automated codemod will be provided. Track issue LOC-112 for status.
