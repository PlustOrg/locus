# Troubleshooting

Common issues and fixes.

## Prisma Client Not Generated
Run one of:
1. `locus build --prisma-generate`
2. Inside generated dir: `npm run prisma:generate`

Ensure `.env` contains a valid `DATABASE_URL`.

## Port Conflicts
API uses `PORT` or 3001. Set a custom: `PORT=4001 locus dev`.
Next dev uses 3000 by default.

## Missing theme.css
Confirm `theme.css` exists in output root and `next-app/public/theme.css`.
Landing page should import `globals.css` which references `/theme.css`.

## CORS Errors
Set `ENABLE_CORS=1` to enable CORS middleware.

## Regeneration Not Triggering
Use `LOCUS_DEBUG=1 locus dev` to view changed files.
Verify file is inside source directory passed to `--src`.

## Generator Error
If build fails with a generator error, the message box will include `Code: validation_error|parse_error|merge_error` or raw generator error text. Fix source or open an issue with the stack trace.

---
Need something else? Open an issue describing reproduction steps and environment.
