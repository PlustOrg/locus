# Contributing

- Run `npm test` to ensure changes are green.
- Add or update tests for any public behavior changes.
- Keep generated outputs deterministic.
- Follow the TDD workflow in `planning/development-plan.md`.
- Use `npm run lint` and `npm run format` before submitting PRs.

### Error Handling Guidelines

- Always throw a LocusError-family error for user-facing failures:
	- PError for parse/lex errors
	- VError for validation errors
	- MergeError (extends LocusError) for merge errors
- Include filePath, line, column, and length (when available) for precise codeframes.
- Never use console.* in core libs; route all user-facing output through the reporter.
- Keep generator functions deterministic and throw GeneratorError for internal failures; if you catch a LocusError, rethrow it so the CLI can report it.

### Reporter Contributions

- When adding new tokens, extend `humanizeToken` with a user-friendly label.
- Keep suggestions minimal and actionable; prefer one-line tips.
