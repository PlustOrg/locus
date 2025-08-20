# Guide: User Authentication

User authentication is a foundational requirement for most web applications. Locus, combined with the right blueprint, makes implementing a secure and complete authentication system straightforward.

This guide explains the concepts and shows how you would use a hypothetical `auth` blueprint to add user authentication to your app.

## The Authentication Blueprint

Instead of having you write the boilerplate for login, signup, and session management from scratch, the recommended approach is to use a Locus Blueprint. A high-quality `auth` blueprint would provide:

*   **`database` block:** A `database` block containing the `User` entity.
*   **`page` blocks:** Pre-built `page` blocks for login and signup.
*   **`store` block:** A global `store Auth` to manage the logged-in user's state across the application.
*   **Backend Logic:** Secure backend routes for handling user registration, login (including password hashing and comparison), and session management (e.g., using JWTs or session cookies).

## Step 1: Generate the Auth Feature

First, you would find a trusted `auth` blueprint and use the `locus generate` command:

```bash
locus generate from https://github.com/locus-blueprints/auth.git
```

This command would prompt you with a few questions (like "What should the user entity be called?") and then add a new `auth.locus` file to your project, containing all the necessary blocks.

After generating, you'd run a database migration: `locus db migrate 'add-auth-system'`.

## Step 2: Understanding the Generated Code

Let's look at what the key generated blocks would contain inside `auth.locus`.

### `database` block

```locus
database {
  entity User {
    email: String (unique)
    passwordHash: String
    name: String?
  }
}
```
*Note: The blueprint would never store plain-text passwords. It would generate backend logic to handle hashing.*

### `store` block

This global store is the single source of truth for the user's authentication state.

```locus
// file: auth.locus

store Auth {
  currentUser: User? = null
  isLoggedIn: Boolean = false
  isLoading: Boolean = true // Start with loading state
}

// The blueprint would also include a special `on app load` hook
// that runs once when the app starts.
on app load {
  // This action would make an API call to '/api/auth/me'
  // to check if a valid session cookie exists.
  const user = await api.get('/api/auth/me');
  if (user) {
    Auth.currentUser = user;
    Auth.isLoggedIn = true;
  }
  Auth.isLoading = false;
}
```

### `page` block for Login

This would contain the login form and the `login` action.

```locus
page Login {
  state {
    email: ""
    password: ""
    error: ""
  }

  action login() {
    try {
      // This makes a secure, HTTP-only cookie-based API call
      const user = await api.post('/api/auth/login', { email, password });
      Auth.currentUser = user;
      Auth.isLoggedIn = true;
      // Redirect to the home page or dashboard
      Router.push('/'); 
    } catch (e) {
      error = e.message;
    }
  }

  ui {
    <form on:submit|prevent-default={login}>
      // ... text fields for email and password
      <Button type="submit">Log In</Button>
      <if condition={error}><Text color="danger">{error}</Text></if>
    </form>
  }
}
```

## Step 3: Protecting Routes and Showing User Info

Now that the `Auth` store is available globally, you can use it anywhere in your application to create protected routes and display user-specific information.

### Conditionally Rendering UI

In any `.locus` file, you can check the `Auth.isLoggedIn` status.

```locus
// in your main layout or header component
ui {
  <nav>
    <Link href="/">Home</Link>
    <if condition={Auth.isLoading}>
      <Spinner />
    </if>
    <elseif condition={Auth.isLoggedIn}>
      <Text>Welcome, {Auth.currentUser.name}</Text>
      <Link href="/profile">Profile</Link>
      <Button on:click={logout}>Logout</Button>
    </elseif>
    <else>
      <Link href="/login">Login</Link>
      <Link href="/signup">Sign Up</Link>
    </else>
  </nav>
}
```
The `logout` action would be part of the blueprint, making an API call to invalidate the session.


### Protecting Pages

To protect a page, you can add a check in its `on load` hook and redirect if the user is not authenticated.

```locus
page Dashboard {
  on load {
    // If auth state is done loading and user is not logged in...
    if !Auth.isLoading && !Auth.isLoggedIn {
      Router.push('/login');
    }
  }

  ui {
    // This UI will only be seen by logged-in users.
    <Header>Welcome to your Dashboard</Header>
  }
}
```

By using a blueprint, you get a robust, secure, and fully-featured authentication system implemented in minutes, allowing you to focus on the unique features of your application.
