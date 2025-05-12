/**
 * Static methods:
 * Outcome.success<R>(value: R): Outcome<R, never>;
 * Outcome.failure<E>(error: E): Outcome<never, E>;
 *
 * Outcome.fromSupplier<R, E>(
 *   supplier: () => R | PromiseLike<R>,
 *   errorFn?: (err: unknown) => E    // if not provided any error in supplier or Promise becomes a defect
 * ): Outcome<R, E>;
 *
 * Outcome.fromFunction<A extends readonly any[], R, E>(
 *   producingFunction: (...args: A) => R | PromiseLike<R>,
 *   errorFn?: (err: unknown) => E   // if not provided any error in producingFunction or Promise becomes a defect
 * ): (...args: A) => Outcome<R, E>;
 *
 * Outcome.combine<R, E>(
 *   producers: () => IOutcome<R, E>[]  // any error in producer becomes a defect
 * ): Outcome<(R | never)[], (E | never)[]>;
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotPromiseLike<T> = T extends PromiseLike<any> ? never : T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NotOutcome<T> = T extends IOutcome<any, any> ? never : T;

export type ValidOutcomeValue<T> = NotOutcome<NotPromiseLike<T>>;

export interface IOutcome<R, E> {
  // Any error in transformer function becomes a defect
  map<T>(transformer: (value: R) => T): IOutcome<T, E>;

  // Any error in consumer function becomes a defect
  tap(consumer: (value: R) => void): IOutcome<R, E>;

  // Any error in errorTransformer function becomes a defect
  mapFailure<F>(errorTransformer: (error: E) => F): IOutcome<R, F>;

  // Any error in errorConsumer function becomes a defect
  tapFailure(errorConsumer: (error: E) => void): IOutcome<R, E>;

  recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | IOutcome<R, F>,
  ): IOutcome<R, E | F>;

  // Any error in operation function becomes a defect
  flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): IOutcome<T, E | F>;

  through<F>(operation: (value: R) => IOutcome<unknown, F>): IOutcome<R, E | F>;

  finally<F>(finalization: () => IOutcome<unknown, F>): IOutcome<R, E | F>;
}
