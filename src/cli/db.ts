import { execAsync } from './utils/process';

/**
 * The `db` command provides a set of utilities for interacting with the database.
 * These commands are simple wrappers around the `prisma` CLI.
 */

/**
 * Runs the `prisma migrate dev` command to apply database migrations.
 */
export async function runDbMigrate(): Promise<void> {
  // The command creates and applies a new migration to the development database.
  // It also ensures the database is in sync with the Prisma schema.
  await execAsync('npx prisma migrate dev');
}

/**
 * Runs the `prisma studio` command to open the Prisma Studio GUI.
 */
export async function runDbStudio(): Promise<void> {
  // This command opens a local GUI to view and edit data in the database,
  // which is useful for development and debugging.
  await execAsync('npx prisma studio');
}
