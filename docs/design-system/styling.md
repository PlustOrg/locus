# Styling and Layout

Locus provides a powerful and streamlined system for styling your application. It combines a token-based design system with a set of flexible layout components, allowing you to build beautiful, consistent, and responsive interfaces with minimal effort.

## The Design System Approach

Styling in Locus is centered around the `design_system` block, typically defined in a `theme.locus` file. This block is the single source of truth for your application's visual identity. Instead of hardcoding CSS values like `#007bff` or `16px` throughout your components, you define them once as **design tokens**.

**Example Tokens:**
```locus
design_system {
  colors {
    light {
      primary: "#007bff"
      background: "#ffffff"
    }
  }
  spacing {
    md: "1rem" // 16px
  }
}
```

The Locus compiler takes these tokens and makes them available as CSS Custom Properties (e.g., `var(--color-primary)`, `var(--spacing-md)`). The built-in component library is designed to use these tokens by default.

This approach has several key benefits:
*   **Consistency:** Ensures all components adhere to the same style guide.
*   **Maintainability:** To change your primary brand color, you only need to edit one line.
*   **Theming:** Makes creating different themes (like dark mode) trivial.

For more details on defining tokens, see the **[Theming](./theming.md)** guide.

## Layout Components

Locus provides a set of primitive layout components that use a flexbox-based system to handle alignment, spacing, and distribution.

### `<Stack>`

The most fundamental layout component. It arranges its children vertically in a single column.

*   **`spacing`**: Controls the space between each child. It accepts a spacing token from your design system (e.g., `spacing="md"`).
*   **`align`**: Controls how children are aligned along the cross-axis (horizontally). Values: `"start"`, `"center"`, `"end"`, `"stretch"`.
*   **`justify`**: Controls how children are distributed along the main axis (vertically). Values: `"start"`, `"center"`, `"end"`, `"space-between"`.

```locus
ui {
  <Stack spacing="lg" align="center">
    <Header>Welcome</Header>
    <Text>This is a vertically stacked layout.</Text>
    <Button>Get Started</Button>
  </Stack>
}
```

### `<HStack>` (Horizontal Stack)

Similar to `<Stack>`, but arranges its children horizontally in a single row. The `align` and `justify` props work similarly but on opposite axes.

```locus
ui {
  <HStack spacing="md" align="center">
    <Text>Name:</Text>
    <TextField placeholder="Enter your name" />
    <Button>Submit</Button>
  </HStack>
}
```

### `<Grid>`

For creating two-dimensional, grid-based layouts.

*   **`columns`**: The number of columns in the grid (e.g., `columns={3}`).
*   **`gap`**: The space between grid cells, accepting a spacing token (e.g., `gap="md"`).

```locus
ui {
  <Grid columns={3} gap="lg">
    <ProductCard />
    <ProductCard />
    <ProductCard />
    <ProductCard />
    <ProductCard />
    <ProductCard />
  </Grid>
}
```

### `<Box>`

A general-purpose container component that can be used for custom styling or as a building block for more complex layouts. It accepts common styling props.

*   `padding`, `paddingX`, `paddingY`
*   `margin`, `marginX`, `marginY`
*   `width`, `height`
*   `backgroundColor`
*   `borderRadius`

```locus
ui {
  <Box
    padding="lg"
    backgroundColor="surface"
    borderRadius="md"
    shadow="sm"
  >
    <Text>This is a content card.</Text>
  </Box>
}
```

## Responsive Design

Locus components are designed to be responsive out of the box. For more granular control, you can provide different values for props at different breakpoints. The breakpoints (`sm`, `md`, `lg`, `xl`) are defined in your `Locus.toml` file.

The syntax uses a responsive object notation:

```locus
ui {
  // This stack will have 3 columns on large screens, 2 on medium, and 1 on small.
  <Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="md">
    ...
  </Grid>

  // This text will be larger on medium screens and up.
  <Header size={{ sm: "2xl", md: "4xl" }}>
    Responsive Header
  </Header>
}
```

## Custom Styling with `style:override`

While the design system and layout components cover most use cases, you can always drop down to raw CSS for fine-grained control using the `style:override` block.

This block allows you to write standard CSS that is **scoped** to the current component, meaning the styles won't leak out and affect other parts of your application.

You can (and should) still use your design tokens within this block via the `var()` function.

```locus
component SpecialButton {
  param children: slot

  ui {
    <button class="special-button">
      {children}
    </button>
  }

  style:override {
    .special-button {
      background-image: linear-gradient(
        to right,
        var(--color-primary),
        var(--color-secondary)
      );
      border: none;
      color: white;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--radii-full);
      font-weight: var(--typography-weight-bold);
      transition: transform 0.2s;
    }

    .special-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }
  }
}
```
