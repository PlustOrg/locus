# Creating Blueprints

Blueprints are the fastest way to create and share reusable features within the Locus ecosystem. A blueprint is a collection of `.locus` files that represent a complete, self-contained feature, like a blog, a user authentication system, or a contact form.

Unlike TypeScript plugins, which require knowledge of the Locus compiler's internals, blueprints are written entirely in the Locus language itself. This makes them incredibly easy to create and maintain.

## What is a Blueprint?

At its core, a blueprint is a template. It consists of:
1.  **A set of `.locus` files:** These contain the `database`, `page`, `component`, and `design_system` blocks that make up the feature.
2.  **(Optional) A `blueprint.toml` manifest:** This file defines metadata about the blueprint, including any placeholder variables that the user needs to configure.

When a user runs `locus generate <blueprint-name>`, the CLI fetches the blueprint, processes the templates, and copies the resulting `.locus` files into their project.

## Creating Your First Blueprint

Let's create a simple blueprint for a "contact us" page.

### 1. Directory Structure

First, create a directory for your blueprint. The directory name will be the name of the blueprint.

```
contact-form/
├── src/
│   ├── contact.locus
└── blueprint.toml
```

*   The `src/` directory holds the Locus files that will be copied into the user's project.
*   `blueprint.toml` is the manifest file.

### 2. The Manifest (`blueprint.toml`)

This file describes your blueprint and defines any configurable variables.

```toml
# file: contact-form/blueprint.toml

name = "Contact Form"
description = "Adds a contact page and a database entity to store submissions."

# Define variables that the user will be prompted to fill in.
[vars]
notification_email = { prompt = "Which email address should be notified of new submissions?", type = "string" }
```

The `[vars]` section is key. For each variable, you define:
*   `prompt`: The question that will be asked to the user in the CLI.
*   `type`: The expected type of the variable (e.g., `string`, `boolean`, `integer`).

### 3. The Locus Code (`src/contact.locus`)

Now, write the Locus code for the feature. You can use your defined variables within the `.locus` files using the `{{variable_name}}` syntax.

```locus
// file: contact-form/src/contact.locus

database {
  entity ContactSubmission {
    name: String
    email: String
    message: Text
    submittedAt: DateTime (default: now())
  }
}

page ContactUs {
  state {
    name: String = ""
    email: String = ""
    message: String = ""
    status: String = "idle" // "idle", "submitting", "success", "error"
  }

  action submitForm() {
    status = "submitting"
    
    // Create a record in the database
    const submission = create(ContactSubmission, {
      name: name,
      email: email,
      message: message
    })

    // This is a placeholder for sending an email.
    // A real implementation might use a TypeScript plugin.
    log("Sending notification to: {{notification_email}}")

    if submission {
      status = "success"
    } else {
      status = "error"
    }
  }

  ui {
    <Stack spacing="md">
      <Header>Contact Us</Header>

      <if condition={status == "success"}>
        <Text>Thank you for your message!</Text>
      </if>
      <else>
        <TextField placeholder="Your Name" bind:value={name} />
        <TextField placeholder="Your Email" type="email" bind:value={email} />
        <TextArea placeholder="Your Message" bind:value={message} />
        <Button on:click={submitForm} disabled={status == "submitting"}>
          <if condition={status == "submitting"}>
            <Spinner />
          </if>
          <else>
            Submit
          </else>
        </Button>
        <if condition={status == "error"}>
          <Text color="danger">Something went wrong. Please try again.</Text>
        </if>
      </else>
    </Stack>
  }
}
```

### 4. Publishing and Using the Blueprint

To publish your blueprint, you would typically upload it to a Git repository (like GitHub). The Locus CLI can then fetch blueprints directly from Git URLs.

A user would run:

```bash
locus generate PlustOrg/locus-blueprint-contact-form
```

The CLI would then prompt them:

```
? Which email address should be notified of new submissions? > me@mycompany.com
```

After they answer, the `src/contact.locus` file would be created in their project with `{{notification_email}}` replaced by `me@mycompany.com`.

## Best Practices for Blueprints

*   **Keep them focused:** A blueprint should do one thing well. Instead of a massive "SaaS" blueprint, create smaller, composable blueprints for "auth," "billing," and "admin-dashboard."
*   **Use variables for customization:** Identify the parts of your feature that are most likely to change between projects and turn them into variables in `blueprint.toml`.
*   **Provide good defaults:** For variables that have a common value, you can provide a `default` in the manifest.
*   **Document your blueprint:** Include a `README.md` file in your blueprint's repository explaining what it does and how to use it.
