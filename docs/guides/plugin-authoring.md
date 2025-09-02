# Plugin Authoring Guide

This guide explains how to extend Locus with custom plugins that participate in the compile pipeline.

## Overview
Plugins are plain JS/TS objects exported from a `locus.plugins.js` (or `.cjs` / `.mjs`) file in your project root. The CLI loads them, validates an `apiVersion`, and invokes lifecycle hooks.

```js
// locus.plugins.js
module.exports = [
  {
    name: 'my-plugin',
    apiVersion: 1,
    onParseStart(file, src, ctx) { /* inspect or warn */ },
    onFileParsed(file, ast, ctx) { /* mutate virtual AST via ctx.addVirtualAst */ },
    onParseComplete(asts, ctx) { /* final adjustments */ },
    onValidate(unified, ctx) { /* add warnings */ },
    onBeforeGenerate(unified, ctx) { /* register generators */ },
    onAfterGenerate(result, ctx) { /* write artifacts */ },
    registerWorkflowStepKinds() { return [{ kind: 'my_step', run(step, { ctx }) { ctx.log.push({ kind:'my_step' }); } }]; }
  }
];
```

## Hook Context Helpers
Every hook receives a context with:
- `addWarning(msg)` – surface non-fatal issues.
- `addVirtualAst(astFragment)` – inject components/pages/entities.
- `writeArtifact(path, content)` – emit an additional generated file.
- `registerGenerator(name, fn)` – batch-generate files post core generation.

## Workflow Step Kinds
Provide `registerWorkflowStepKinds()` returning objects with:
```ts
{ kind: string; run?(step: any, execCtx: { ctx: any }): any }
```
Steps without a built‑in handler fallback to plugin kinds during execution.

## Validation Add‑Ons
Declare capabilities:
```js
capabilities: {
  validations: [{ id: 'my-check', run(unified){ /* throw or warn */ } }],
  workflowSteps: [{ kind:'queue_publish', schema:{ /* shape */ } }],
  tokens: ['MyKeyword']
}
```

## Performance Notes
Slow hooks (>50ms) generate warnings. Use environment variable `LOCUS_PLUGIN_HOOK_WARN_MS` to tune thresholds.

## Debugging
Run with `--debug` to capture timing and metrics written to `generated/BUILD_METRICS.json` including plugin hook durations.

---
For deeper architecture details, see `docs/reference/architecture.md`.