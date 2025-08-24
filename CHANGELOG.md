# Changelog

All notable changes to this project will be documented in this file.

## 1.0.0 - 2025-08-16
## 0.2.0 - 2025-08-24
### Added
- Plugin lifecycle hooks: onParseStart, onFileParsed, onParseComplete, onValidate, onBeforeGenerate, onAfterGenerate
- Plugin virtual AST injection, custom generators (registerGenerator), extra artifact emission (writeArtifact)
- Plugin performance timings, timeouts (LOCUS_PLUGIN_TIMEOUT_MS), performance threshold warnings (LOCUS_PLUGIN_HOOK_WARN_MS)
- Module resolution for string plugin specifiers via node module names, caching of loaded plugin modules
- CLI: `locus plugins list`, `locus plugins doctor` with hook summary, timings, warnings
- Manifest validation (apiVersion=1) with warnings for unsupported versions
- Conflict detection for artifact path collisions (first wins)
- Snapshot test coverage for custom generator output

### Changed
- Build meta now includes pluginTimings

### Notes
- Future work: sandbox execution, remote plugin fetching, richer generator extension docs.

- Initial public release of Locus compiler
- Database/design_system parsers and generators
- Features parsing (page/component/store) with UI AST
- CLI commands: db/build/dev/new/deploy
- Deterministic outputs and incremental dev build support
