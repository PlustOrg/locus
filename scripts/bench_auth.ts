import { performance } from 'perf_hooks';

/**
 * Creates a mock request object for benchmarking.
 * @param role - Optional user role to include in the request headers.
 * @returns A mock request object.
 */
function createMockRequest(role?: string) {
  return {
    headers: role ? { 'x-user': role } : {},
    auth: undefined,
  } as any;
}

/**
 * Creates a mock response object for benchmarking.
 * @returns A mock response object.
 */
function createMockResponse() {
  return {
    status: (_code: number) => ({
      json: () => {},
    }),
  } as any;
}

/**
 * Runs the authentication middleware benchmark.
 * This script measures the performance of a simulated authentication middleware
 * that assigns user data to the request object.
 */
async function runBenchmark() {
  const iterations = 10000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    const req = createMockRequest('user');
    // Simulate a trivial middleware cost (property assignment).
    (req as any).auth = { id: 1, roles: ['user'] };
  }

  const duration = performance.now() - start;
  console.log(
    JSON.stringify({
      iterations,
      milliseconds: duration,
      perIteration: duration / iterations,
    })
  );
}

runBenchmark();
