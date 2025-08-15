# Theming with the Design System

Locus integrates a design system directly into its workflow, enabling you to define and manage your application's visual identity from one or more `design_system` blocks within your `.locus` files. This approach is the source of truth for all stylistic properties, from colors to typography to spacing.

The compiler will discover all `design_system` blocks in your project and merge their contents, allowing you to keep all tokens in a single `theme.locus` file or distribute them across multiple files. This separation of structure from style allows for rapid theming, consistent branding, and easy maintenance.

## The `design_system` Block

This block defines all the visual properties of your application using **design tokens**. Design tokens are named entities that store a value, like a hex code for a color or a pixel value for a font size.

When you run `locus dev` or `locus build`, the compiler reads all `design_system` blocks and generates a global CSS file that defines all your tokens as CSS Custom Properties. This makes them available to all components in your application.

**Example `theme.locus` file:**

```locus
// file: theme.locus

design_system {
  // Colors are defined in themes. 'light' and 'dark' are common.
  colors {
    light {
      primary: "#007bff"
      primary-hover: "#0056b3"
      background: "#f8f9fa"
      surface: "#ffffff"
      text: "#212529"
      text-muted: "#6c757d"
      danger: "#dc3545"
      success: "#28a745"
      border: "#dee2e6"
    }
    dark {
      primary: "#0a84ff"
      primary-hover: "#0a6cff"
      background: "#121212"
      surface: "#1e1e1e"
      text: "#e0e0e0"
      text-muted: "#8e8e93"
      danger: "#ff453a"
      success: "#32d74b"
      border: "#38383a"
    }
  }

  // Typography defines font properties.
  typography {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    baseSize: "16px"
    
    // Font weights can be defined as named tokens.
    weights {
      regular: 400
      medium: 500
      bold: 700
    }
  }

  // Spacing units for margins, paddings, and gaps.
  spacing {
    xs: "0.25rem" // 4px
    sm: "0.5rem"  // 8px
    md: "1rem"    // 16px
    lg: "1.5rem"  // 24px
    xl: "2rem"    // 32px
  }

  // Radii for border-radius.
  radii {
    sm: "0.2rem"
    md: "0.375rem"
    lg: "0.5rem"
    full: "9999px"
  }

  // Shadows for elevation.
  shadows {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
  }
}
```

## How Tokens are Used

The built-in Locus component library is designed to use these tokens by default. For example, the `<Button>` component's default background color might be set to `var(--color-primary)`, which corresponds to the `primary` token in your `colors` block.

When you change a token's value in a `design_system` block, the change is automatically reflected across every component that uses it, ensuring perfect consistency.

### Automatic Dark Mode

By defining `light` and `dark` themes in your `colors` block, Locus can automatically handle theme switching. The generated CSS will use a `prefers-color-scheme` media query to apply the correct set of color variables based on the user's operating system preference. You get standards-compliant dark mode for free.

## Customizing Themes

You are not limited to `light` and `dark`. You can define any number of themes.

```locus
design_system {
  colors {
    light { ... }
    dark { ... }
    "high-contrast" {
      primary: "#000000"
      background: "#ffffff"
      text: "#000000"
    }
  }
}
```

A `store` could then be used to manage the currently active theme, which would apply a class name to the root `<html>` element, allowing the appropriate theme's styles to take effect.

> **Developer Q&A:**
> **Q: Where do the token names come from? Are they standardized?**
> **A:** The token names within each category (`primary`, `background`, `sm`, `md`, etc.) are conventional but not strictly enforced. The built-in components will look for these common names. For example, a `<Button color="primary">` will look for the `primary` color token. You are free to add your own tokens (e.g., `brand-accent: "#ff6b00"`) and use them in custom styles. The compiler will merge all `design_system` blocks, so you can define typography in one file and colors in another.


## Accessing Tokens in Custom Styles

When you need to write custom CSS using the `style:override` block, you can access your design tokens using the standard CSS `var()` function. The Locus compiler automatically converts your token names into CSS variables.

*   `colors.light.primary` becomes `var(--color-primary)`
*   `spacing.md` becomes `var(--spacing-md)`
*   `typography.weights.bold` becomes `var(--typography-weight-bold)`

```locus
style:override {
  .my-custom-class {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: var(--spacing-lg);
    border-radius: var(--radii-lg);
    box-shadow: var(--shadow-md);
  }
}
```

This powerful system ensures that even your custom styles remain consistent with your overall application theme.
