# UI Lexical Mode & Location Metadata

Locus now performs a lightweight lexical pass for UI blocks before structural transformation. This enables:

- Stable token boundaries that won’t conflict with database/model tokens.
- Precise `line:column` + offset metadata on UI element nodes and attributes.
- Future rich diagnostics (invalid bindings, unknown events, expression errors) with accurate code frames.

## What Exists Today

The UI parser (`parseUi`) pre-processes directive sugar (`{#if}`, `{#each}`, etc.) into temporary element tags, then performs a single pass building a raw tree. During this pass we record:

- `start` and `end` byte offsets (UTF-16 indices) for elements and expression segments.
- Attribute offsets & lengths for every parsed attribute.
- Derived `loc` objects: `{ line, column, endLine, endColumn }` on element nodes plus `loc` on attributes.

## Consuming Locations

A helper `buildUiCodeFrame(filePath, loc)` (in `src/cli/uiDiagnostics.ts`) produces a simple code frame highlighting the element or attribute span. This is intended for use by future validation passes and error reporters.

```ts
import { buildUiCodeFrame } from '../cli/uiDiagnostics';

// given a node with .loc
console.log(buildUiCodeFrame('MyPage.locus', node.loc));
```

## Event & Binding Warnings

Validation now issues warnings for:

- Unknown `onX` events (passes through but flagged).
- Lowercase variants like `onclick` with a suggested canonical `onClick`.
- Invalid bind targets (e.g. `bind:value` becomes internal `bind$value`).

## Roadmap

- Migrate UI parsing to full Chevrotain grammar (reusing lexical tokens here).
- Integrate UI code frames directly into the core reporter for unified error formatting.
- Expression type checking leveraging component state/params.

## CLI Aid

You can experiment quickly:

```bash
echo '<Button onClick="{doThing}">Hi</Button>' | locus ui:ast
```

This prints the structured UI AST including location metadata.

---
_Last updated: 2025-09-04_
