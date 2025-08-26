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
