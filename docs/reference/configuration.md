# Configuration (`Locus.toml`)

Your project's configuration is managed in a single file named `Locus.toml` at the root of your source directory. This file uses the [TOML](https://toml.io/en/) format, which is designed to be simple and easy to read.

## `[app]` Section
This section contains general information about your application.

**Keys:**
- `name` (string): The name of your application. This is used when generating files like `package.json`.

**Example:**
```toml
[app]
name = "My Awesome App"
```

---

## `[auth]` Section
This section configures the authentication and authorization features of your application.

**Keys:**
- `jwtSecret` (string): The secret key used to sign and verify JSON Web Tokens (JWTs). **It is critical that you change this from the default value for production environments.**
- `adapter` (string): The relative path to your custom authentication adapter file. This file should export functions for handling sessions.
- `requireAuth` (boolean): If `true`, all pages will require authentication by default. You can override this on a per-page basis.

**Example:**
```toml
[auth]
# It's recommended to use an environment variable for the secret
jwtSecret = "your-super-secret-key-here"
adapter = "./authAdapter.js"
requireAuth = true
```

---

## `[deploy.ENVIRONMENT]` Section
You can define settings for different deployment environments, like `staging` or `production`. The `locus deploy <environment>` command uses the corresponding section.

**Keys:**
- `platform` (string): The name of your primary hosting provider (e.g., "vercel", "netlify").
- `backend_platform` (string): The name of your backend hosting provider if it's different from the primary platform (e.g., "railway", "render").
- `database_url` (string): The connection string for your production database. It's strongly recommended to set this via an environment variable instead of hardcoding it.

**Example:**
```toml
# Settings for the 'production' environment
[deploy.production]
platform = "vercel"
backend_platform = "railway"
# database_url is best set via an environment variable on your host
```

---

## `[performance]` Section
This section allows you to fine-tune performance-related settings, particularly for plugins.

**Keys:**
- `pluginHookWarnMs` (integer): The number of milliseconds a plugin hook can run before a performance warning is issued. Can also be set via the `LOCUS_PLUGIN_HOOK_WARN_MS` environment variable.
- `pluginTimeoutMs` (integer): The number of milliseconds a plugin can run before it times out. Can also be set via the `LOCUS_PLUGIN_TIMEOUT_MS` environment variable.

**Example:**
```toml
[performance]
pluginHookWarnMs = 100
pluginTimeoutMs = 5000
```
