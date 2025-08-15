# Creating and Using Blueprints

Blueprints are the simplest way to create reusable, shareable extensions for Locus. A blueprint is essentially a template for a feature, written in Locus itself. It consists of a collection of `.locus` files that, when installed, are copied directly into a user's project.

Blueprints are ideal for packaging common application features like a blog, a documentation site, user authentication, or a settings page.

## Philosophy

The goal of blueprints is to accelerate development by solving common problems in a reusable way, without sacrificing customizability. When a user generates a feature from a blueprint, they receive the raw Locus source code, which they are then free to read, understand, and modify to their heart's content. There's no "black box."

## Creating a Blueprint

Creating a blueprint is as simple as creating a Locus project.

1.  **Create a new project or directory.** This will be your blueprint's repository.
2.  **Write the Locus code.** Create the `.locus` files that make up your template, using `database`, `page`, `component`, and other blocks.
3.  **Use placeholders for customization (optional).** A blueprint can contain placeholders that the user will be prompted to fill in when they generate the feature. Placeholders are denoted by double curly braces: `{{placeholder_name}}`.
4.  **Add a `blueprint.toml` file.** This manifest file describes your blueprint and defines any placeholders.
5.  **Push to a Git repository.** Blueprints are shared via Git, most commonly on GitHub.

### Example: A Simple Blog Blueprint

Let's say we want to create a blueprint for a basic blog.

**Blueprint file structure:**

```
locus-blog-blueprint/
├── blog.locus
└── blueprint.toml
```

**`blueprint.toml`:**

```toml
# Describes the blueprint
name = "Simple Blog"
description = "Adds a blog to your Locus application with posts and authors."

# Defines prompts for the user
[prompts]
author_entity = { 
  message = "What is the name of your existing user entity?", 
  default = "User" 
}
main_layout_component = {
  message = "What is your main layout component (for wrapping pages)?",
  default = "MainLayout"
}
```

**`blog.locus`:**

```locus
database {
  // We use the placeholder from the prompt
  entity {{author_entity}} {
    posts: has_many Post
  }

  entity Post {
    title: String
    content: Text
    publishedAt: DateTime?
    author: belongs_to {{author_entity}}
  }
}

// Use another placeholder for the layout
import { {{main_layout_component}} } from "./layout.locus"

page BlogIndex {
  state { posts: list of Post = [] }
  on load { posts = find(Post, where: { publishedAt: { not: null } }) }
  ui {
    <{{main_layout_component}}>
      <Header>My Blog</Header>
      <PostPreview for:each={post in posts} post={post} />
    </{{main_layout_component}}>
  }
}
// ... other pages and components for the blog
```

## Using a Blueprint

Using a blueprint is a one-step process with the `locus` CLI.

**Command:** `locus generate from <url_to_git_repo>`

**Example:**
`locus generate from https://github.com/user/locus-blog-blueprint.git`

### What Happens

When a user runs this command, the `locus` CLI will:
1.  Clone the blueprint repository to a temporary directory.
2.  Read the `blueprint.toml` file.
3.  For each entry in the `[prompts]` section, it will ask the user the question.
4.  It will then copy all the `.locus` files from the blueprint into the user's project.
5.  As it copies the files, it will replace any placeholders (like `{{author_entity}}`) with the answers the user provided.

The end result is that the user instantly has a new, fully integrated blog feature in their application, written in clean Locus code that they can now customize.


## Blueprints vs. TypeScript Plugins

| Aspect          | Blueprint                                       | TypeScript Plugin                                |
| :-------------- | :---------------------------------------------- | :----------------------------------------------- |
| **Language**    | Written in Locus                                | Written in TypeScript                            |
| **Mechanism**   | Copies Locus files into a project (generation)  | Hooks into the compiler (integration)            |
| **Use Case**    | Shareable feature templates (blog, auth)        | Deep integration with JS libraries (Stripe, etc.) |
| **Customization** | User edits the generated Locus code directly.   | User consumes the provided components/commands.  |
| **Complexity**  | Very simple to create.                          | More complex, requires knowledge of plugin SDK.  |
