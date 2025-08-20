# Development Workflow and Best Practices

The Locus toolchain is designed to create a smooth, efficient, and enjoyable development experience. This guide walks through the typical workflow, from starting the development server to debugging and testing your application.

## The Core Development Loop

The vast majority of your time developing with Locus will revolve around two things: your code editor and the `locus dev` command.

1.  **Start the Dev Server:**
    Open your terminal, navigate to your project directory, and run:
    ```bash
    locus dev
    ```
    This single command starts the compiler in watch mode, spins up the frontend and backend servers, and connects to your development database. It will tell you the local URL where your application is running (e.g., `http://localhost:3000`).

2.  **Make Changes:**
    Open your project in your favorite code editor. Start editing your `.locus` files.

3.  **See Instant Updates:**
    As soon as you save a `.locus` file, the `locus dev` process detects the change, performs a lightning-fast incremental recompilation, and hot-reloads the application in your browser. You don't need to manually refresh the page.
    *   Changes to a `ui` block update the interface instantly.
    *   Changes to an `action` or `state` block are applied seamlessly.
    *   Changes to a `design_system` block restyle the entire application on the fly.


This tight feedback loop allows for rapid iteration and keeps you in a state of flow.

## Debugging Your Application

Even with a streamlined language, debugging is a necessary part of development. Locus provides a transparent and intuitive debugging experience.

### Source Maps: Your Locus Code in the Browser

Thanks to source maps, when you open your browser's DevTools (e.g., in Chrome or Firefox), you can debug your application using the original Locus code you wrote, not the compiled JavaScript.

*   **Setting Breakpoints:** You can set breakpoints directly inside an `action` block in the DevTools "Sources" panel. When the action is triggered, execution will pause, and you can inspect the values of your state variables.
*   **Console Logs:** Use `log()` within your `action` blocks to print values to the browser console. `log("Current user:", Auth.currentUser)`
*   **UI Inspection:** The "Elements" panel will show the generated HTML, which can be useful for debugging layout and styling issues.

### Database Debugging

For issues related to data, your best tool is `locus db studio`.

1.  Open a new terminal window (leaving `locus dev` running).
2.  Run `locus db studio`.
3.  This opens a web interface where you can see your tables, filter and sort data, and even manually add, edit, or delete records to test different scenarios.

## Co-located Testing

Locus encourages a healthy testing culture by making it incredibly easy to write tests. Tests are defined in `tests { ... }` blocks, directly inside the `page` or `component` block they are testing.

### Writing a Test

A `tests` block can contain one or more `test` cases. The syntax is designed to be simple and readable.

```locus
// file: login.locus

page Login {
  // ... state, actions, ui ...
  
  tests {
    test "successful login sets auth store" {
      // 1. Setup: Mock the API call
      mock_api(POST, "/api/login", {
        body: { email: "test@user.com", password: "password" },
        returns: { user: { id: 1, name: "Test User" }, token: "abc" }
      })

      // 2. Action: Simulate user input and actions
      await component.find("TextField[name=email]").type("test@user.com")
      await component.find("TextField[name=password]").type("password")
      await component.find("Button[type=submit]").click()

      // 3. Assertion: Check the result
      assert Auth.isLoggedIn == true
      assert Auth.currentUser.name == "Test User"
    }

    test "shows error message on failed login" {
      mock_api(POST, "/api/login", {
        status: 401,
        returns: { error: "Invalid credentials" }
      })

      await component.find("Button[type=submit]").click()

      // Assert that an element with the error message is now visible
      assert component.find(".error-message").text() == "Invalid credentials"
    }
  }
}
```

### Running Tests

To run all tests in your project, simply execute:

```bash
locus test
```

The toolchain will discover all `tests` blocks, run them in a controlled environment, and report the results.


**Benefits of Co-located Tests:**
*   **High Visibility:** Tests are right next to the code they cover, making it easy to see if a feature is well-tested.
*   **Easy Maintenance:** When you change a feature, the relevant tests are in the same file, reminding you to update them.
*   **Context-Rich:** It's easier to understand what a test is doing because the component's implementation is just a scroll away.
