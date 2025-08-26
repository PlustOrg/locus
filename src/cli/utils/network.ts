import * as net from 'net';

/**
 * Checks if a given network port is available.
 * @param port The port to check.
 * @returns A promise that resolves to true if the port is free, and false otherwise.
 */
function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err: NodeJS.ErrnoException) => {
      // An error (like EADDRINUSE) means the port is likely in use.
      try {
        server.close();
      } catch {}
      resolve(false);
    });

    server.once('listening', () => {
      // If the server can listen, the port is free.
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

/**
 * Finds an available network port by checking ports sequentially, starting from a given port.
 * @param startPort The first port to check.
 * @returns A promise that resolves to the first available port found.
 */
export async function pickFreePort(startPort: number): Promise<number> {
  const maxAttempts = 20;
  let port = startPort;
  for (let i = 0; i < maxAttempts; i++) {
    const isFree = await isPortFree(port);
    if (isFree) {
      return port;
    }
    port++;
  }
  // Fallback to the starting port if no free port is found after several attempts.
  return startPort;
}
