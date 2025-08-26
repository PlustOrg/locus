/**
 * A simple promise-based concurrency limiter.
 *
 * @param concurrency The maximum number of promises to run concurrently.
 * @returns A function that takes a promise-returning function and schedules it for execution.
 */
export function pLimit(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (active >= concurrency || queue.length === 0) {
      return;
    }
    const job = queue.shift()!;
    active++;
    job();
  };

  return function <T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        Promise.resolve(fn()).then(
          (value) => {
            active--;
            resolve(value);
            next();
          },
          (error) => {
            active--;
            reject(error);
            next();
          }
        );
      };
      queue.push(run);
      next();
    });
  };
}
