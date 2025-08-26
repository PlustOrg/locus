import { spawn, exec, SpawnOptions } from 'child_process';
import { EventEmitter } from 'events';

/**
 * A safe wrapper around child_process.spawn that handles cross-platform differences
 * and provides a mock implementation for testing environments.
 *
 * @param cmd The command to execute.
 * @param args The arguments to pass to the command.
 * @param cwd The working directory for the command.
 * @returns A child process instance.
 */
export function spawnSafe(cmd: string, args: string[], cwd?: string) {
  // In a test environment (indicated by the LOCUS_TEST_DISABLE_SPAWN flag),
  // return a mock process object to avoid actual process spawning.
  if (process.env.LOCUS_TEST_DISABLE_SPAWN === '1') {
    const fakeProcess: any = new EventEmitter();
    fakeProcess.stdout = new EventEmitter();
    fakeProcess.stderr = new EventEmitter();
    fakeProcess.kill = () => {
      fakeProcess.emit('exit', 0);
    };
    // Simulate some process output for testing purposes.
    setTimeout(() => fakeProcess.stdout.emit('data', Buffer.from('test output')), 5);
    return fakeProcess;
  }

  // For Windows, we use the shell option to ensure commands are found correctly.
  const isWindows = process.platform === 'win32';
  const processOptions: SpawnOptions = { stdio: 'pipe', cwd, shell: isWindows };

  return spawn(cmd, args, processOptions);
}

/**
 * An async wrapper for child_process.exec.
 *
 * @param cmd The command to execute.
 * @returns A promise that resolves when the command completes successfully, and rejects on error.
 */
export function execAsync(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
