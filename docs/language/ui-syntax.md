# UI Syntax in Locus

Locus uses a declarative, XML-like syntax for building user interfaces. The `ui` block in each `page` or `component` describes the structure, data binding, event handling, and control flow of your UI.

## Core Syntax

- **Components:** Use built-in or custom components (e.g., `<Stack>`, `<Button>`, `<UserAvatar>`).
- **Props:** Pass data via attributes (e.g., `size="large"`, `user={user}`).

```locus
ui {
  <Stack>
    <Header>Welcome</Header>
    <TextField placeholder="Name" bind:value={name} />
    <Button on:click={submit}>Submit</Button>
  </Stack>
}
```

## Data Binding

Use `bind:value` for two-way binding on inputs:

```locus
<TextField bind:value={name} />
```

## Event Handling

Use `on:event` to link UI events to actions:

```locus
<Button on:click={increment}>+1</Button>
```

## Control Flow

- **Conditional Rendering:** `<if>`, `<elseif>`, `<else>`
- **List Rendering:** `for:each`

```locus
<if condition={isLoading}>
  <Spinner />
</if>
<else>
  <Table items={customers} />
</else>

<ProductCard for:each={product in products} product={product} />
```

## Slots and Children

Custom components can accept slots for nested content:

```locus
component Card {
  param children: slot
  ui {
    <div class="card">{children}</div>
  }
}
```

<!-- skip-validate -->
```locus
<Card>
  <Text>Inside the card!</Text>
</Card>
```

See [Styling & Layout](../design-system/styling.md) for more on customizing appearance.
