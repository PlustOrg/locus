# UI Syntax Reference

You build user interfaces in Locus inside the `ui` block of a `page` or `component`. The syntax is designed to feel familiar to HTML, but with powerful, built-in features for handling data, events, and control flow.

## Basic Syntax
UI is composed of elements that look like HTML tags. These can be standard HTML tags (like `<div>`, `<h1>`, `<ul>`) or Locus components (like `<Stack>`, `<Button>`, or your own custom components).

```locus
ui {
  <Stack>
    <h1>Welcome!</h1>
    <p>This is a Locus application.</p>
  </Stack>
}
```

### Props
You pass data to elements using attributes, which are called "props". Prop values can be static strings or dynamic expressions.

```locus
// Static string prop
<TextField placeholder="Enter your name" />

// Dynamic expression prop (from a state variable)
<UserProfile user={currentUser} />

// Boolean prop
<Button disabled={true}>Cannot click</Button>
```

## Built-in UI Components

Locus provides a small set of built-in UI components that you can use out-of-the-box to quickly build your user interfaces. These components are designed to be simple, flexible, and automatically styled by your application's design system.

When you use these components in your `.locus` files, the Locus generator will automatically add the necessary imports to your generated React code.

### Available Components

Here are the built-in components and their available properties:

#### `<Button>`

A standard button element.

-   `variant`: `'primary'` (default) or `'secondary'`.
-   `onClick`: An action to perform when the button is clicked.
-   `disabled`: A boolean to disable the button.

Example:
```locus
page HomePage {
  action sayHello {
    log("Hello, World!")
  }
  ui {
    <Button onClick={sayHello}>Click Me</Button>
  }
}
```

#### `<Stack>`

A flexbox container for arranging items in a vertical or horizontal stack.

-   `direction`: `'column'` (default) or `'row'`.
-   `gap`: The space between children (e.g., `"1rem"`, `8`).
-   `align`: The `align-items` CSS property.
-   `justify`: The `justify-content` CSS property.
-   `wrap`: A boolean to allow items to wrap.

Example:
```locus
ui {
  <Stack direction="row" gap="1rem">
    <Text>Item 1</Text>
    <Text>Item 2</Text>
  </Stack>
}
```

#### `<Input>`

A text input field.

-   `value`: The current value of the input.
-   `onChange`: An action that receives the new value when the input changes.
-   `placeholder`: The placeholder text.
-   `disabled`: A boolean to disable the input.

Example:
```locus
page FormPage {
  state name: string = ""
  ui {
    <Input bind:value={name} placeholder="Enter your name" />
  }
}
```

#### `<Text>`

A component for rendering text content.

-   `as`: The HTML tag to render as (e.g., `'p'`, `'h1'`, `'span'`). Defaults to `'p'`.
-   `variant`: `'body'` (default), `'heading'`, or `'subtle'`.

Example:
```locus
ui {
  <Stack>
    <Text as="h1" variant="heading">This is a heading</Text>
    <Text>This is body text.</Text>
    <Text variant="subtle">This is subtle text.</Text>
  </Stack>
}
```

### Overriding Built-in Components

If you define your own component with the same name as a built-in component (e.g., `Button`), the Locus generator will prioritize your version. When it detects `<Button />` in your UI, it will import your custom component instead of the built-in one.

This allows you to create your own design system and component library that seamlessly replaces the default Locus components.

Example:
If you have `components/Button.locus` defined:
```locus
// components/Button.locus
component Button {
  ui {
    <button class="my-custom-button">{children}</button>
  }
}
```

And you use it in a page:
```locus
// pages/MyPage.locus
page MyPage {
  ui {
    // This will use your custom Button, not the built-in one.
    <Button>Custom Button</Button>
  }
}
```
The generated code will contain `import Button from '../components/Button';` instead of the built-in runtime import.

## Data Binding
For form inputs, Locus provides two-way data binding with the `bind:value` directive. This creates a direct link between an input and a state variable.

```locus
state {
  name: String = ""
}

ui {
  // When the user types, the 'name' state variable is automatically updated.
  // If 'name' is changed elsewhere, the input field will update.
  <TextField placeholder="Enter your name" bind:value={name} />
}
```
> **How it works:** `bind:value={name}` is syntactic sugar for `value={name} onChange={(e) => setName(e.target.value)}`. It works with any state variable that has a corresponding setter (`setVariableName`).

## Event Handling
Use the `on:[event]` directive to call an `action` when a user interacts with an element. You can use any standard browser event name.

```locus
action sayHello() {
  log("Hello, world!")
}

ui {
  <Button on:click={sayHello}>Say Hello</Button>
}
```

**Common Events:**
- `on:click`
- `on:submit` (for forms)
- `on:change` (for inputs)
- `on:mouseEnter` / `on:mouseLeave`
- `on:focus` / `on:blur`

## Control Flow
You can conditionally render UI or create loops using special Locus elements.

### Conditional Rendering
Use the `<if>`, `<elseif>`, and `<else>` elements to control which parts of your UI are shown.

```locus
state {
  status: String = "loading"
}

ui {
  <if condition={status == "loading"}>
    <Spinner />
  </if>
  <elseif condition={status == "error"}>
    <p>Something went wrong!</p>
  </elseif>
  <else>
    <DataTable items={data} />
  </else>
}
```

### List Rendering
Use the `for:each` directive to render a list of items. The syntax is `{item in iterable}`.

```locus
state {
  products: list of Product = []
}

ui {
  <ul>
    // This will create a ProductCard for each product in the list
    <ProductCard for:each={product in products} product={product} />
  </ul>
}
```

## Slots & Children
Components can render content passed to them from their parent. This is handled with "slots".

### The Default `children` Slot
If you declare `param children: slot` in a component, you can render it in the `ui` block by referencing `{children}`.

<!-- skip-validate -->
```locus
// component definition
component Card {
  param children: slot
  ui {
    <div class="card-container">
      {children}
    </div>
  }
}

// usage
<Card>
  <p>This content will be placed inside the card.</p>
</Card>
```
> **Auto-Slot Feature:** If you use `{children}` in your component's UI, Locus will automatically assume you meant to have a `param children: slot`, even if you didn't write it.

### Named Slots
You can also define multiple, named slots for more complex components. A named slot is just a `param` of type `slot` that ends with the word "Slot".

<!-- skip-validate -->
```locus
// component definition
component PageLayout {
  param headerSlot: slot
  param footerSlot: slot
  ui {
    <header>{headerSlot}</header>
    <main>...</main>
    <footer>{footerSlot}</footer>
  }
}

// usage
<PageLayout>
  <headerSlot>
    <h1>My Page Title</h1>
  </headerSlot>
  <footerSlot>
    <p>&copy; 2024</p>
  </footerSlot>
</PageLayout>
```

## Styling
See the [Design System & Theming](../guides/design-system.md) documentation for details on styling components. For custom components, you can link a CSS file using the `style: override` block.

```locus
component MyStyledButton {
  param children: slot
  style: override {
    // This block links './MyStyledButton.css'
  }
  ui {
    <button class="my-button">{children}</button>
  }
}
```
