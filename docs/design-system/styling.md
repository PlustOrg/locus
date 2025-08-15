# Styling and Extensibility

While the `design_system` block provides the foundation for your app's look and feel, Locus offers several ways to apply and override styles for specific components, giving you full control over the final appearance.

## The Built-in Component Library

Locus provides a core set of unstyled, structural components. Their entire look and feel are derived from the tokens in your `design_system` blocks. This means they are a blank canvas, ready to be styled according to your brand.


*   **Layout:** `<Stack>`, `<Grid>`, `<HStack>` (Horizontal Stack), `<VStack>` (Vertical Stack)
*   **Primitives:** `<Button>`, `<TextField>`, `<Checkbox>`, `<Header>`, `<Text>`, `<Card>`, `<Modal>`, `<Spinner>`
*   **Data Display:** `<Table>`, `<List>`

These components are designed to be accessible and functional out of the box. For example, a `<Modal>` will handle focus trapping, and a `<Table>` will be structured semantically. Their styling, however, is entirely up to you via the design system.

## Applying Styles

There are three primary ways to style a component in Locus, ranging from high-level convenience to fine-grained control.

### 1. Style Props

The easiest way to apply a style variant is through style props. The built-in components come with a set of convenient props that map directly to your design tokens.

```locus
ui {
  // This button will use the `danger` color token for its background.
  <Button color="danger">Delete</Button>

  // This text will use the `text-muted` color token.
  <Text color="muted">This is a subtitle</Text>

  // This stack will have a gap corresponding to the `lg` spacing token.
  <VStack spacing="lg">
    <Card />
    <Card />
  </VStack>
}
```

Common style props include:
*   `color`: Maps to a color token (e.g., `primary`, `danger`).
*   `size`: Maps to a size variant (e.g., `sm`, `md`, `lg`).
*   `spacing`, `p`, `m`: For gap, padding, and margin, mapping to spacing tokens.
*   `fontWeight`: Maps to typography weight tokens (e.g., `regular`, `bold`).

### 2. The `class` Attribute

For applying pre-defined CSS classes, you can use the standard `class` attribute. This is useful when integrating with utility-class CSS frameworks like Tailwind CSS, or when you have a separate, global CSS file.

```locus
ui {
  // Assuming you have Tailwind-like utility classes available
  <div class="p-4 bg-white rounded-lg shadow-md">
    <Text class="text-xl font-bold">Card Title</Text>
  </div>
}
```

### 3. The `style:override` Block (Escape Hatch)

For one-off customizations or complex styling needs that can't be met with props or classes, Locus provides the `style:override` block. This is your "escape hatch" to write raw, scoped CSS for a component.

The CSS inside this block is **scoped**, meaning it will only apply to the component it's defined in, preventing style leakage. You can also access all your design tokens using the `var(--token-name)` syntax.

```locus
component FunkyButton {
  param children: slot

  ui {
    <button class="funky-button">
      {children}
    </button>
  }

  style:override {
    .funky-button {
      // You can access your design tokens
      background: linear-gradient(45deg, var(--color-primary), var(--color-success));
      color: var(--color-text-on-primary); // Assuming you defined such a token
      padding: var(--spacing-md) var(--spacing-xl);
      border-radius: var(--radii-full);
      border: none;
      font-weight: var(--typography-weight-bold);
      transition: transform 0.2s ease-out;
    }

    .funky-button:hover {
      transform: scale(1.05) rotate(-3deg);
    }
  }
}
```

> **Developer Q&A:**
> **Q: When should I use `style:override` vs. creating a new component?**
> **A:** Use `style:override` for styles that are truly unique to that one component. If you find yourself repeating the same `style:override` block in multiple places, it's a strong signal that you should encapsulate that UI and style into a new, reusable component. For example, if you style a `<Button>` in a specific way for all your primary actions, you should create a `<PrimaryButton>` component.

## Global Styles

To apply styles to the entire application (e.g., resetting default browser styles, setting a global font-family on the `body`), you can create a `global.css` file in the root of your project. The Locus toolchain will automatically detect this file and inject it into your application's build.
