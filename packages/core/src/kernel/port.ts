import { failure, Outcome, success } from 'defectless';
import { Throwable } from '../common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFn = (...args: any[]) => any;

export class PortError extends Throwable {
  public readonly _tag = 'PortError';

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

export type Port<
  F extends AsyncFn,
  E extends Throwable | never = never,
  W extends (...args: Parameters<F>) => Outcome<ReturnType<F>, E> = (
    ...args: Parameters<F>
  ) => Outcome<ReturnType<F>, E>,
> = {
  (...args: Parameters<F>): Outcome<ReturnType<F>, E | PortError>;
  accept: (handler: W) => Outcome<void, PortError>;
};

export function createPort<
  F extends AsyncFn,
  E extends Throwable | never = never,
  W extends (...args: Parameters<F>) => Outcome<ReturnType<F>, E> = (
    ...args: Parameters<F>
  ) => Outcome<ReturnType<F>, E>,
>(concurrency = 1): Port<F, E, W> {
  let worker: W | null = null;
  const queue: (() => Promise<void>)[] = [];
  let active = 0;

  const runNext = () => {
    while (active < concurrency && queue.length > 0) {
      const task = queue.shift()!;
      active++;
      task();
    }
  };

  const port = (...args: Parameters<F>): Outcome<ReturnType<F>, E | PortError> => {
    const { promise, resolve, reject } = Promise.withResolvers<ReturnType<F>>();
    const task = async () => {
      if (!worker) {
        return reject(new PortError('Port handler not assigned'));
      }

      try {
        await worker(...args).match(resolve, reject, reject);
      } catch (err) {
        return reject(new PortError('Worker failure', err));
      } finally {
        active--;
        runNext();
      }
    };

    queue.push(task);
    runNext();

    return Outcome.fromSupplier(
      () => promise,
      (err) => err as E,
    );
  };

  port.accept = (fn: W): Outcome<void, PortError> => {
    if (worker) {
      return failure(new PortError('Port already assigned'));
    }

    worker = fn;

    return success();
  };

  return port as Port<F, E, W>;
}
