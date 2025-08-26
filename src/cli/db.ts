import { execAsync } from './utils';

/**
 * Run Prisma database migration.
 */
export async function runDbMigrate(_opts: { cwd?: string }) {
  await execAsync('npx prisma migrate dev');
}

/**
 * Open Prisma Studio GUI for database management.
 */
export async function runDbStudio(_opts: { cwd?: string }) {
  await execAsync('npx prisma studio');
}
