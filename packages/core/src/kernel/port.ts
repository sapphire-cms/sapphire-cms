export type Port<F extends (...args: any[]) => Promise<any>> = {
  (...args: Parameters<F>): ReturnType<F>;
  accept: (handler: F) => void;
};

export function createPort<F extends (...args: any[]) => Promise<any>>(concurrency = 1): Port<F> {
  let worker: F | null = null;
  const queue: (() => Promise<void>)[] = [];
  let active = 0;

  const runNext = () => {
    while (active < concurrency && queue.length > 0) {
      const task = queue.shift()!;
      active++;
      task();
    }
  };

  const port = (...args: Parameters<F>): ReturnType<F> => {
    return new Promise((resolve, reject) => {
      const task = async () => {
        if (!worker) {
          reject(new Error('Port handler not assigned'));
          return;
        }

        try {
          const result = await worker(...args);
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          active--;
          runNext();
        }
      };

      queue.push(task);
      runNext();
    }) as ReturnType<F>;
  };

  port.accept = (fn: F) => {
    if (worker) throw new Error('Port already assigned');
    worker = fn;
  };

  return port as Port<F>;
}
