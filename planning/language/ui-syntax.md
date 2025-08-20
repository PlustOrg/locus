# UI Syntax and Logic

The `ui` block in a `page` or `component` is where you declaratively describe the user interface. The syntax is designed to be familiar to anyone who has worked with HTML or modern UI frameworks like React or Vue, but with powerful, integrated features for data binding, event handling, and control flow.


## Core Syntax

The UI is built by nesting components. Locus provides a set of built-in components (like `<Stack>`, `<Button>`, `<TextField>`), and you can create your own.

```locus
ui {
  <Stack>
    <Header>My Application</Header>
    <Text>Welcome to Locus.</Text>
    <Button>Get Started</Button>
  </Stack>
}
```

### Component Properties (Props)

You pass data and configuration to components using properties (props), similar to HTML attributes.

*   **Static Values:** `size="large"`, `isPrimary={true}`
*   **Dynamic Values:** `{variableName}`, `{Auth.currentUser.name}`

```locus
ui {
  <Stack spacing={mySpacingVariable}>
    <Header size="large">{pageTitle}</Header>
    <Button color="primary" on:click={submitForm}>
      Submit
    </Button>
  </Stack>
}
```

## Data Binding

Locus provides simple and powerful two-way data binding using the `bind:value` directive. This is most commonly used for form inputs.

When you bind a state variable to an input, any change in the input will automatically update the variable, and any change to the variable will automatically update the input's value.

```locus
state {
  name: String = ""
}

ui {
  <Stack>
    // The value of the TextField is now linked to the `name` state variable.
    <TextField placeholder="Enter your name" bind:value={name} />
    
    <Text>Hello, {name || "stranger"}!</Text>
  </Stack>
}
```

## Event Handling

UI events, like clicks or form submissions, are linked to `action` blocks using the `on:event` directive.

*   `on:click`: The most common event, for buttons, links, etc.
*   `on:submit`: For handling form submissions.
*   `on:input`: To trigger an action on every keystroke in an input field.
*   `on:change`: For inputs like checkboxes and select dropdowns.

```locus
state {
  counter: Integer = 0
}

action increment() {
  counter = counter + 1
}

ui {
  <Stack>
    <Text>Counter: {counter}</Text>
    <Button on:click={increment}>
      +1
    </Button>
  </Stack>
}
```

### Passing Arguments to Actions

You can pass arguments to your actions directly from the event handler.

```locus
action setFilter(newFilter: String) {
  // ... logic
}

ui {
  <HStack>
    <Button on:click={setFilter("all")}>All</Button>
    <Button on:click={setFilter("active")}>Active</Button>
    <Button on:click={setFilter("completed")}>Completed</Button>
  </HStack>
}
```

## Control Flow

Locus provides special components for conditional rendering and list rendering, which are fundamental for building dynamic interfaces.

### Conditional Rendering: `<if>`, `<elseif>`, `<else>`

These components allow you to render UI blocks based on a condition.

```locus
state {
  status: String = "loading" // can be "loading", "success", or "error"
}

ui {
  <if condition={status == "loading"}>
    <Spinner />
  </if>
  <elseif condition={status == "success"}>
    <Icon name="check-circle" color="success" />
    <Text>Data loaded successfully!</Text>
  </elseif>
  <else>
    <Icon name="alert-triangle" color="danger" />
    <Text>Failed to load data.</Text>
  </else>
}
```

### List Rendering: `for:each`

To render a list of items, you use the `for:each` attribute on a component. This will repeat the component for each item in the specified array.

Inside the loop, the current item is available via the `item` variable, and its index is available via the `index` variable.

```locus
state {
  products: list of Product = []
}

on load {
  products = find(Product)
}

ui {
  <Stack>
    <ProductCard for:each={product in products} product={product} />
  </Stack>
}
```

You can also customize the name of the item variable:

```locus
<div for:each={p in products} key={p.id}>
  <Text>{p.name}</Text>
</div>
```

> **Developer Q&A:**
> **Q: Why use `<if>` components instead of a ternary operator inside `{}`?**
> **A:** While simple ternaries might be allowed for trivial cases, the `<if>` component approach is more declarative and readable, especially for complex conditions with multiple branches (`elseif`). It keeps the UI block clean and free of complex JavaScript expressions, aligning with the Locus philosophy of clarity.

## Slots and Children

Components can render content passed to them by their parent. This is achieved through the `children` prop.

```locus
// Definition of a Card component
component Card {
  param children: slot
  param title: String?

  ui {
    <div class="card">
      <if condition={title}>
        <Header>{title}</Header>
      </if>
      <div class="card-content">
        {children}
      </div>
    </div>
  }
}

// Usage
<Card title="My Dashboard">
  <Text>This content will be placed inside the Card.</Text>
  <Button>Click me</Button>
</Card>
```
