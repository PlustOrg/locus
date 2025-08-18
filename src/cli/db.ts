import { exec } from 'child_process';

export async function runDbMigrate(_opts: { cwd?: string }) {
  await execAsync('npx prisma migrate dev');
}

export async function runDbStudio(_opts: { cwd?: string }) {
  await execAsync('npx prisma studio');
}

function execAsync(cmd: string) {
  return new Promise<void>((resolve, reject) => {
    exec(cmd, (err) => {
      if (err) reject(err); else resolve();
    });
  });
}
