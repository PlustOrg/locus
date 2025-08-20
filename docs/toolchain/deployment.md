# Deployment Guide

Locus makes deployment simple and reproducible. The `locus deploy` command and `Locus.toml` configuration file work together to deploy your app to modern platforms.

## Configuration

Define deployment targets in `Locus.toml`:

```toml
[deploy.production]
platform = "vercel"
backend_platform = "railway"
database_url = "env(PRODUCTION_DATABASE_URL)"
```

## Deploying

Run:
```bash
locus deploy production
```

This will:
1. Read your config
2. Build frontend/backend
3. Deploy frontend (Vercel/Netlify)
4. Deploy backend (Railway/Fly.io)
5. Run database migrations
6. Wire up services and report the public URL

## Supported Platforms

- **Frontend:** Vercel, Netlify
- **Backend:** Railway, Fly.io
- **Database:** Supabase, Neon, PostgreSQL

## Custom Deployments

For advanced needs, run `locus build` and use Docker, Terraform, or CI/CD to deploy the generated artifacts.

See [CLI Reference](./cli.md) for deployment commands.
