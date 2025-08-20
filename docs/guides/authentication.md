# Authentication Guide

Locus is designed to make common web application patterns, like user authentication, as simple as possible. While Locus doesn't have a single "auth" command, it provides all the necessary building blocks to create a robust and secure authentication system.

This guide demonstrates how to build a complete email-and-password authentication flow.

## 1. Data Model for Authentication

The first step is to define the data models needed to store user information and credentials. We'll create a `User` entity and a separate `Credential` entity to hold sensitive information.

Open `src/database.locus` and define the entities:

```locus
// file: src/database.locus

database {
  entity User {
    name: String
    email: String (unique)
    
    // A user has one credential record.
    credential: has_one Credential
  }

  entity Credential {
    // This will store the hashed password.
    passwordHash: String
    
    // This ensures a credential belongs to exactly one user.
    user: belongs_to User (unique)
  }
}
```

**Why a separate `Credential` entity?**
*   **Security:** This pattern ensures that the `passwordHash` is never accidentally fetched and sent to the frontend. When you query for a `User`, you won't get their credential information unless you explicitly ask for it.

After adding these entities, run the migration:
```bash
locus db migrate 'add-auth-entities'
```

## 2. Global State for the Current User

We need a way to track the currently logged-in user across the entire application. A global `store` is perfect for this.

Create a new file `src/auth.locus`:

```locus
// file: src/auth.locus

store Auth {
  currentUser: User? = null
  isLoggedIn: false
}
```

This `Auth` store will be the single source of truth for the user's session state.

## 3. Building the Registration Page

Now, let's create the UI and logic for a user to sign up.

In `src/app.locus` (or a new `.locus` file), define the `Register` page:

```locus
// file: src/app.locus

page Register {
  state {
    name: String = ""
    email: String = ""
    password: String = ""
    error: String? = null
  }

  action submit() {
    error = null // Clear previous errors

    // Basic validation
    if not password or password.length < 8 {
      error = "Password must be at least 8 characters long."
      return
    }

    // In a real app, you would call a custom backend action
    // to securely hash the password.
    // For this example, we'll simulate it.
    const passwordHash = "hashed_" + password 

    // Create the user and their credential in a transaction
    const newUser = create(User, {
      name: name,
      email: email,
      credential: {
        create: {
          passwordHash: passwordHash
        }
      }
    })

    if newUser {
      // Automatically log the user in
      Auth.currentUser = newUser
      Auth.isLoggedIn = true
      // Redirect to the home page
      redirect("/")
    } else {
      error = "A user with this email already exists."
    }
  }

  ui {
    <Stack spacing="md" align="center">
      <Header>Create an Account</Header>
      <TextField placeholder="Name" bind:value={name} />
      <TextField placeholder="Email" type="email" bind:value={email} />
      <TextField placeholder="Password" type="password" bind:value={password} />
      
      <if condition={error}>
        <Text color="danger">{error}</Text>
      </if>

      <Button on:click={submit}>Register</Button>
    </Stack>
  }
}
```

**Important Note on Password Hashing:**
The example above uses a fake hashing function (`"hashed_" + password`). In a real-world application, **you must never store plain-text passwords**. The password should be sent to a custom backend function (created with a TypeScript plugin) that uses a strong hashing algorithm like Argon2 or bcrypt before saving it to the database.

## 4. Building the Login Page

The login flow is similar. We'll create a `Login` page that checks credentials.

```locus
// file: src/app.locus (continued)

page Login {
  state {
    email: String = ""
    password: String = ""
    error: String? = null
  }

  action submit() {
    error = null

    // This is a placeholder for a custom backend action
    // that would securely check the password hash.
    const user = findOne(User, where: { email: email })
    
    if user {
      // In a real app, you'd compare the provided password
      // against the stored hash.
      // e.g., checkPassword(password, user.credential.passwordHash)
      Auth.currentUser = user
      Auth.isLoggedIn = true
      redirect("/")
    } else {
      error = "Invalid email or password."
    }
  }

  ui {
    <Stack spacing="md" align="center">
      <Header>Sign In</Header>
      <TextField placeholder="Email" type="email" bind:value={email} />
      <TextField placeholder="Password" type="password" bind:value={password} />
      
      <if condition={error}>
        <Text color="danger">{error}</Text>
      </if>

      <Button on:click={submit}>Login</Button>
    </Stack>
  }
}
```

## 5. Protecting Content

Now you can use the `Auth` store to conditionally show UI elements based on the user's login status.

```locus
// In any page or component

ui {
  <HStack>
    <if condition={Auth.isLoggedIn}>
      <Text>Welcome, {Auth.currentUser.name}</Text>
      <Button on:click={logoutAction}>Logout</Button>
    </if>
    <else>
      <Link href="/login">Login</Link>
      <Link href="/register">Register</Link>
    </else>
  </HStack>
}
```

You can also protect entire pages by adding a check in the `on load` lifecycle hook:

```locus
page Dashboard {
  on load {
    if not Auth.isLoggedIn {
      redirect("/login")
    }
    // ... fetch dashboard data
  }

  ui { ... }
}
```

This guide provides the fundamental structure for authentication. For a production system, you would enhance this with a TypeScript plugin to handle secure password hashing and session management (e.g., using JWTs).
