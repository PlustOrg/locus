# Development Workflow

Locus is designed for rapid, iterative development. The core workflow revolves around editing `.locus` files and running `locus dev`.

## Typical Loop

1. **Start the Dev Server:**
   ```bash
   locus dev
   ```
   This compiles your code, starts frontend/backend servers, and watches for changes.

2. **Edit `.locus` Files:**
   Make changes to data models, pages, components, or design system.

3. **See Instant Updates:**
   The dev server hot-reloads your app in the browser. UI, logic, and styling changes are reflected immediately.

## Debugging

- **Source Maps:** Debug in browser DevTools using your original Locus code.
- **Console Logs:** Use `log()` in actions to print to the browser console.
- **Database Studio:** Run `locus db studio` for a GUI to inspect and edit data.

## Testing

- Write tests in `tests { ... }` blocks inside your `.locus` files.
- Run all tests with:
  ```bash
  locus test
  ```
- Tests are co-located with features for easy maintenance.

## Best Practices

- Keep features small and focused.
- Use stores for global state.
- Write tests alongside your code.
- Use design tokens for consistent styling.

See [Getting Started](../guides/getting-started.md) for a step-by-step intro.
