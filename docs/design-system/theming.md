# Theming in Locus

Locus supports a robust design token system for theming your application. All visual properties—colors, typography, spacing, radii, shadows—are defined in `design_system` blocks, typically in a `theme.locus` file.

## Defining Themes

You can define multiple themes (e.g., `light`, `dark`, `high-contrast`) in your design system:

```locus
design_system {
  colors {
    light {
      primary: "#007bff"
      background: "#f8f9fa"
      text: "#212529"
    }
    dark {
      primary: "#0a84ff"
      background: "#121212"
      text: "#e0e0e0"
    }
  }
  typography {
    fontFamily: "Inter, sans-serif"
    baseSize: "16px"
    weights {
      regular: 400
      bold: 700
    }
  }
  spacing {
    sm: "0.5rem"
    md: "1rem"
    lg: "1.5rem"
  }
  radii {
    md: "0.375rem"
    full: "9999px"
  }
  shadows {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
  }
}
```

## How Themes Work

- The compiler generates CSS custom properties for all tokens (e.g., `var(--color-primary)`).
- Built-in components use these tokens by default.
- Theme switching is automatic if you define `light` and `dark` themes; the generated CSS uses `prefers-color-scheme`.
- You can add custom themes and switch them via a global store or class on `<html>`.

## Custom Tokens

You can add any tokens you need (e.g., `brand-accent`, `danger`, `success`). Use them in custom styles or components.

## Accessing Tokens in CSS

Use the `var()` function in `style:override` blocks:

```locus
style:override {
  .my-class {
    background: var(--color-primary);
    padding: var(--spacing-md);
    border-radius: var(--radii-md);
  }
}
```

See [Styling & Layout](./styling.md) for more on using tokens in your UI.
