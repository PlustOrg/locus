# Design System & Theming

Locus has a built-in system for defining design tokens, which are the values that form the foundation of your application's visual identity. This allows you to manage your app's theme from a single, central location.

All design tokens are defined within a `design_system` block in any `.locus` file.

```locus
design_system {
  // Token categories go here
}
```

## Color Theming (Fully Implemented)
The `colors` block is where you define color palettes for different themes, like "light" and "dark". This is the primary, fully-functional part of the design system.

### Defining Color Themes
Inside the `colors` block, you can define one or more named themes. Each theme is a collection of color tokens.

```locus
design_system {
  colors {
    "light" {
      primary: "#007aff"
      background: "#ffffff"
      text: "#1c1c1e"
      subtle: "#f2f2f7"
    }

    "dark" {
      primary: "#0a84ff"
      background: "#1c1c1e"
      text: "#f2f2f7"
      subtle: "#2c2c2e"
    }
  }
}
```

### How it Works
Locus takes your color definitions and generates a CSS file (`theme.css`) containing CSS Custom Properties (variables). Each token is converted into a variable scoped to its theme using a `data-theme` attribute.

The example above would generate the following CSS:

```css
[data-theme="light"] {
  --color-primary: #007aff;
  --color-background: #ffffff;
  --color-text: #1c1c1e;
  --color-subtle: #f2f2f7;
}
[data-theme="dark"] {
  --color-primary: #0a84ff;
  --color-background: #1c1c1e;
  --color-text: #f2f2f7;
  --color-subtle: #2c2c2e;
}
```

### Using Color Tokens
You can then use these variables in the custom CSS for your components.

For example, if you have a custom button component, you can link a stylesheet using `style: override` and then use the `var()` function to access your theme colors.

**`MyButton.locus`:**
```locus
component MyButton {
  param children: slot
  style: override {} // This links MyButton.css
  ui {
    <button class="my-button">{children}</button>
  }
}
```

**`MyButton.css`:**
```css
.my-button {
  background-color: var(--color-primary);
  color: var(--color-background);
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
}
```
This approach ensures that your components will automatically adapt to the current theme ("light" or "dark").

## Other Token Types (Planned)
The Locus parser recognizes syntax for other types of design tokens, but these **do not currently generate any CSS variables**. They are reserved for future enhancements to the design system.

- **`typography`**: For defining font families, sizes, and weights.
- **`spacing`**: For defining consistent margins and padding.
- **`radii`**: For defining border-radius values.
- **`shadows`**: For defining box-shadow styles.

You can safely include these blocks in your `design_system`, but they will have no effect on the generated output at this time.

```locus
design_system {
  // This block is parsed but does not generate CSS yet.
  typography {
    fontFamily: "Inter, sans-serif"
    baseSize: "16px"
  }
}
```
