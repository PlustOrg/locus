# Getting Started: Building a To-Do List App

This guide will walk you through building your first Locus application: a simple, yet functional, to-do list. By the end of this tutorial, you will have touched on all the core concepts of Locus: entities, features, state, actions, and UI.

## Step 1: Create a New Project

First, let's create a new Locus project. Open your terminal and run:

```bash
locus new todo-app
cd todo-app
```

This command scaffolds a new project with the following structure:
```
todo-app/
├── database.entities
├── design.system
├── index.feature
└── Locus.toml
```

## Step 2: Define the Data Model

Our to-do app needs a way to store tasks. We'll define a `Todo` entity for this.

Open `database.entities` and replace its content with the following:

```locus
// file: database.entities

entity Todo {
  text: String
  isCompleted: Boolean (default: false)
  createdAt: DateTime (default: now())
}
```

This defines a `Todo` table with three fields:
*   `text`: The content of the to-do item.
*   `isCompleted`: A flag to mark it as done, defaulting to `false`.
*   `createdAt`: A timestamp for when it was created, defaulting to the current time.

Now, we need to apply this change to our database. Run the migration command:

```bash
locus db migrate 'create-todo-entity'
```
This creates and runs a migration file, updating your development database schema.

## Step 3: Build the Feature

Now for the fun part. We'll build the entire application inside a single `.feature` file. Open `index.feature` and replace its contents.

### 3.1: The `state` block

First, let's define the state our page will need. We need a list to hold our to-dos and an input field for adding new ones.

```locus
// file: index.feature
page TodoList {
  state {
    todos: list of Todo = []
    newTodoText: String = ""
  }
}
```

### 3.2: The `on load` hook

When the page loads, we need to fetch all the existing to-dos from the database. We'll use the `on load` lifecycle hook and the built-in `find` function.

```locus
// ... inside page TodoList
  on load {
    // Order by creation date, newest first
    todos = find(Todo, orderBy: { createdAt: "desc" })
  }
// ...
```

### 3.3: The `actions`

We need three actions:
1.  `addTodo`: To create a new to-do item.
2.  `toggleTodo`: To mark a to-do as complete or incomplete.
3.  `deleteTodo`: To remove a to-do.

Add these `action` blocks below the `on load` hook:

```locus
// ... inside page TodoList
  action addTodo() {
    // Don't add empty todos
    if newTodoText.trim() == "" {
      return
    }

    const newTodo = create(Todo, { text: newTodoText })
    
    // Add the new todo to the top of the list
    todos.prepend(newTodo)

    // Clear the input field
    newTodoText = ""
  }

  action toggleTodo(todoToToggle: Todo) {
    const updatedTodo = update(todoToToggle, { isCompleted: !todoToToggle.isCompleted })
    // Locus is smart enough to update the item in the `todos` list automatically
  }

  action deleteTodo(todoToDelete: Todo) {
    delete(todoToDelete)
    todos.remove(todoToDelete)
  }
// ...
```

### 3.4: The `ui` block

Finally, let's describe the UI. We'll have a header, an input form, and a list of the to-dos.

```locus
// ... inside page TodoList
  ui {
    <Stack spacing="lg" class="max-w-xl mx-auto mt-8">
      <Header>My To-Do List</Header>

      // Form for adding new todos
      <HStack as="form" on:submit|prevent-default={addTodo}>
        <TextField placeholder="What needs to be done?" bind:value={newTodoText} />
        <Button type="submit">Add</Button>
      </HStack>

      // List of existing todos
      <VStack spacing="md">
        <TodoItem for:each={todo in todos} todo={todo} />
      </VStack>
    </Stack>
  }
}
```
*Notice we're referencing a `<TodoItem>` component that we haven't created yet. Let's do that now.*

## Step 4: Create a Reusable Component

It's good practice to break down UI into smaller components. Let's create the `TodoItem` component in the same file. Add this block *below* the `page TodoList` block.

```locus
// file: index.feature
// ... page TodoList block ends here

component TodoItem {
  param todo: Todo

  ui {
    <HStack justify="between" align="center" class="p-4 bg-surface rounded-lg">
      <Checkbox bind:checked={todo.isCompleted} on:change={toggleTodo(todo)}>
        <Text text-decoration={todo.isCompleted ? 'line-through' : 'none'}>
          {todo.text}
        </Text>
      </Checkbox>
      <Button on:click={deleteTodo(todo)} color="danger" variant="ghost">
        Delete
      </Button>
    </HStack>
  }
}
```
This component receives a `todo` object as a parameter and displays it. It reuses the `toggleTodo` and `deleteTodo` actions from the parent page.

## Step 5: Run the App!

Your `index.feature` file is now complete. Let's see it in action. Run the dev server:

```bash
locus dev
```

Open your browser to `http://localhost:3000`. You should see your to-do application! Try adding, checking off, and deleting items. It all works, with hot-reloading, a live database connection, and a fully interactive UI, all from just two simple files.
