# Deployment

Locus is designed not just for rapid development, but also for seamless deployment. The `locus deploy` command and the `Locus.toml` configuration file work together to provide a zero-configuration deployment experience for modern hosting platforms.

## Deployment Philosophy

The goal of Locus deployment is to make going live as easy as running the development server.
*   **Convention over Configuration:** Locus makes smart assumptions based on best practices for deploying full-stack applications.
*   **Integrated:** The toolchain handles the deployment of the frontend, backend, and database.
*   **Reproducible:** All configuration is stored in `Locus.toml`, so any team member can deploy the application.

## The `Locus.toml` Configuration File

This file, located at the root of your project, is where you define your project's metadata and deployment targets.

**Example `Locus.toml`:**

```toml
[app]
name = "My Awesome App"

# Deployment targets for different environments
[deploy.staging]
platform = "vercel" # For the frontend
database_url = "env(STAGING_DATABASE_URL)"

[deploy.production]
platform = "vercel"
backend_platform = "railway"
database_url = "env(PRODUCTION_DATABASE_URL)"

[plugins]
# Configuration for any plugins you are using
```

*   **`[app]`**: Basic information about your application.
*   **`[deploy.production]`**: Defines the services and credentials for your production environment. You can have multiple deployment targets (e.g., `[deploy.staging]`).
*   **`platform`**: The primary hosting provider, typically for the frontend. Supported values: `"vercel"`, `"netlify"`.
*   **`backend_platform`**: (Optional) If you want to host your backend on a different service. Supported values: `"railway"`, `"fly"`. If omitted, Locus will attempt to deploy the backend to the primary `platform` (e.g., as Vercel Serverless Functions).
*   **`database_url`**: The connection string for your production database. It's highly recommended to load this from an environment variable (`env(...)`) rather than hardcoding it.

## The `locus deploy` Command

This is the command that brings it all together.

**Usage:** `locus deploy <environment>`

*   `locus deploy production`
*   `locus deploy staging`

### What it Does

When you run `locus deploy production`, the toolchain performs the following steps automatically:

1.  **Read Configuration:** It reads the `[deploy.production]` section of your `Locus.toml` file.
2.  **Authenticate:** It uses locally stored API keys (which you would set up once using `locus login`) to authenticate with the specified providers (e.g., Vercel, Railway).
3.  **Run Production Build:** It executes `locus build` to create an optimized, production-ready artifact of your frontend and backend.
4.  **Deploy Frontend:** It uses the provider's CLI (e.g., `vercel deploy`) to push the frontend build. It also configures the necessary environment variables, like the URL of the deployed backend.
5.  **Deploy Backend:** It containerizes the backend application and pushes it to the backend hosting provider. It configures its environment variables, including the `DATABASE_URL`.
6.  **Run Database Migrations:** Critically, it connects to the production database and prompts you to run any pending database migrations that you've created during development. This ensures your database schema is up-to-date with your application code.
7.  **Finalize:** It "wires up" the services, ensuring the frontend knows how to talk to the backend, and reports the final public URL of your application.

## Supported Platforms

Locus aims to support a curated list of best-in-class hosting providers that offer a great developer experience.

*   **Frontend / Full-Stack:**
    *   **Vercel (Recommended):** Excellent integration with Next.js, serverless functions, and global CDN.
    *   **Netlify:** Another top-tier choice for frontend hosting.
*   **Backend:**
    *   **Railway (Recommended):** Incredibly simple to deploy and scale containerized applications.
    *   **Fly.io:** Deploy your backend close to your users.
*   **Database:**
    *   **Supabase (Recommended):** Provides a PostgreSQL database, authentication, and storage in one platform.
    *   **Neon:** Serverless PostgreSQL.
    *   Any standard PostgreSQL provider.

> **Developer Q&A:**
> **Q: What if I need a more complex deployment, like to AWS or a private server?**
> **A:** Locus is optimized for the platforms listed above. For a fully custom deployment, you can always "eject" from the `locus deploy` command. After running `locus build`, you will have a standard, production-ready Next.js application and a Node.js application in the `.locus/generated/dist` folder. You can then use standard tools like Docker, Terraform, and CI/CD pipelines to deploy these artifacts to any infrastructure you choose.
