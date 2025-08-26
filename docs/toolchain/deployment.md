# Deployment Guide

Locus is designed to produce a standard, production-ready codebase that can be deployed to any modern hosting provider. This guide explains the concepts and provides examples for common platforms.

## Deployment Philosophy
Locus does not lock you into a specific hosting provider. Instead of running a magical, opaque deployment command, you will use the standard deployment workflows for your chosen hosts.

The Locus build process compiles your `.locus` files into a standard project structure containing:
- A Next.js application for your frontend.
- An Express.js server for your backend API.
- A Prisma schema for your database.

You will deploy these generated artifacts just like you would deploy any other standard Next.js or Express.js application.

## The `locus deploy` Command: A Pre-flight Check
The `locus deploy` command is **not** a deployment tool. It is a pre-deployment utility that helps you prepare for a real deployment.

**Usage:**
```bash
locus deploy <environment>
```

When you run this command, it does two things:
1.  **Runs a production build:** It executes `locus build` to ensure your generated code is up-to-date.
2.  **Reads your configuration:** It parses your `Locus.toml` file and displays the deployment settings found in the `[deploy.environment]` section.

This allows you to verify your configuration before kicking off a real deployment with your hosting provider's tools.

## Configuring for Deployment
You define your deployment targets in the `Locus.toml` file. You can specify different settings for each environment (e.g., `production`, `staging`).

```toml
[deploy.production]
# The service that will host your Next.js frontend
platform = "vercel"

# The service that will host your Express.js backend
backend_platform = "railway"

# It is strongly recommended to set your database URL via an
# environment variable in your hosting provider's dashboard.
database_url = "env(PRODUCTION_DATABASE_URL)"
```

## Example: Deploying to Vercel and Railway

Here is a common deployment pattern for a Locus application.

### Frontend (Vercel)
1.  Connect your Git repository (e.g., on GitHub) to a new project in Vercel.
2.  In the Vercel project settings, configure the build commands:
    - **Build Command:** `locus build`
    - **Output Directory:** `generated/next-app`
    - **Install Command:** `npm install`
3.  Add an environment variable for your backend API's URL (e.g., `NEXT_PUBLIC_API_URL=https://your-api.railway.app`).
4.  Push to your `main` branch to trigger a deployment.

### Backend (Railway)
1.  Connect the same Git repository to a new project in Railway.
2.  Configure the service to use a Nixpacks or Dockerfile build process.
3.  Set the start command to `npm start` (which should run `node generated/server.js` or similar).
4.  Add a PostgreSQL or other database service in Railway.
5.  Add environment variables:
    - `DATABASE_URL`: Railway will provide this from its database service.
    - `LOCUS_JWT_SECRET`: Your application's JWT secret.
6.  When you push to `main`, Railway will build and deploy your service.
7.  After the initial deployment, you may need to run database migrations by opening a shell into your Railway instance and running `npx prisma migrate deploy`.

This is just one example. Because Locus generates standard code, you can adapt this workflow to any provider that supports Node.js, such as Netlify, Fly.io, Render, or AWS.
