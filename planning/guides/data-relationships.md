# Practical Guide: Data Relationships

One of the most powerful features of Locus is the simplicity with which you can define and interact with data relationships. This guide provides practical examples of how to set up and use the most common relationship types: one-to-many and many-to-many.

## Scenario: A Project Management App

For our examples, let's imagine we're building a simple project management tool. The core entities will be `Project`, `Task`, and `Tag`.

---

## One-to-Many Relationships (`has_many` / `belongs_to`)

A one-to-many relationship is perfect for when one entity owns or contains multiple instances of another. In our scenario, a `Project` will have many `Task`s, but each `Task` belongs to only one `Project`.

### 1. Defining the Relationship

In one or more `.locus` files, define the relationship using `has_many` and `belongs_to` inside `database` blocks.

```locus
// file: projects.locus

database {
  entity Project {
    name: String
    
    // This project can have many tasks.
    // `tasks` will be a virtual field we can use in our code.
    tasks: has_many Task
  }
}

// file: tasks.locus
database {
  entity Task {
    title: String
    isCompleted: Boolean (default: false)

    // This task belongs to a single project.
    // Locus will automatically create a `projectId` foreign key in the database.
    project: belongs_to Project
  }
}
```

Run `locus db migrate 'add-project-and-task-relations'` to update your database schema.

### 2. Using the Relationship in Code

Locus makes these relationships feel like native objects. The compiler generates all the necessary code to let you traverse the relationships seamlessly.

Let's create a feature to manage a project's page.

**`project-details.locus`:**

```locus
page ProjectDetail {
  // Assume the project ID is coming from the URL, a more advanced topic.
  // For now, we'll hardcode it.
  param projectId: Integer = 1

  state {
    project: Project?
    tasks: list of Task = []
    newTaskTitle: String = ""
  }

  on load {
    // Find the project and, using the relation, pre-fetch its tasks!
    project = findOne(Project, where: { id: projectId }, include: { tasks: true })
    if project {
      tasks = project.tasks
    }
  }

  action addTask() {
    if !project { return }

    const newTask = create(Task, { 
      title: newTaskTitle,
      // Directly assign the project object to the relation field.
      // Locus understands this means setting the foreign key.
      project: project 
    })
    tasks.append(newTask)
    newTaskTitle = ""
  }

  ui {
    <if condition={project}>
      <Header>Project: {project.name}</Header>
      
      // Form to add a new task to this specific project
      <form on:submit|prevent-default={addTask}>
        <TextField bind:value={newTaskTitle} placeholder="New task..." />
        <Button type="submit">Add Task</Button>
      </form>

      // List the tasks for this project
      <VStack>
        <TaskItem for:each={task in tasks} task={task} />
      </VStack>
    </if>
  }
}
```


**Key Concepts:**
*   **`include`**: In the `findOne` call, we use `include: { tasks: true }` to tell Locus to fetch the project *and* all its associated tasks in an optimized way (typically a single extra query).
*   **Direct Assignment**: When creating the `Task`, we simply assign the `project` object to the `project` field. Locus handles the underlying `projectId` foreign key assignment for you.

---

## Many-to-Many Relationships

Many-to-many relationships are used when records on both sides can be linked to multiple records on the other. For example, a `Task` can have many `Tag`s (like "bug", "feature", "urgent"), and a `Tag` can be applied to many `Task`s.

### 1. Defining the Relationship

You declare a many-to-many relationship by placing a `has_many` on **both** sides. Locus is smart enough to know this means a join table is required, and it creates and manages it for you automatically.

```locus
// file: tasks.locus
database {
  entity Task {
    // ... other fields
    tags: has_many Tag
  }
}

// file: tags.locus
database {
  entity Tag {
    name: String (unique)
    color: String (default: "gray")

    tasks: has_many Task
  }
}
```

Run `locus db migrate 'add-tags-and-task-tag-relation'` to update your schema. Locus will create the `Tag` table and a hidden `_TaskToTag` join table.

### 2. Using the Relationship in Code

Working with many-to-many relationships is just as easy. You can connect and disconnect related items.

Let's add tagging to our `TaskItem` component.

**`components/TaskItem.locus`:**

```locus
component TaskItem {
  param task: Task
  
  state {
    allTags: list of Tag = []
  }

  on load {
    // Fetch all available tags to show in a dropdown
    allTags = find(Tag)
  }

  action addTagToTask(tagToAdd: Tag) {
    // The magic `connect` operation for many-to-many
    update(task, {
      tags: { connect: { id: tagToAdd.id } }
    })
    // For instant UI feedback, you might want to update local state too
    task.tags.append(tagToAdd)
  }

  ui {
    <Card>
      <Text>{task.title}</Text>
      
      // Display current tags for the task
      <HStack>
        <TagPill for:each={tag in task.tags} tag={tag} />
      </HStack>

      // UI to add a new tag
      <Select on:change={addTagToTask(event.target.value)}>
        <option disabled selected>Add tag...</option>
        <option for:each={tag in allTags} value={tag}>
          {tag.name}
        </option>
      </Select>
    </Card>
  }
}
```


**Key Concepts:**
*   **`connect`**: To link two existing records in a many-to-many relationship, you use the `connect` keyword inside an `update` operation. You specify the `id` of the record you want to link.
*   **`disconnect`**: Similarly, there is a `disconnect` operation to remove a link without deleting the records themselves. `update(task, { tags: { disconnect: { id: tagId } } })`.
*   **Nested Creates**: You can even create a new tag and connect it in one go: `update(task, { tags: { create: { name: "new-tag-name" } } })`.
