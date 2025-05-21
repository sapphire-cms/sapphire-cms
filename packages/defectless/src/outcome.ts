import { AbstractOutcome } from './abstract-outcome';
import {
  CombinedOutcomes,
  InferFailureTypes,
  InferResultTypes,
  IOutcome,
} from './defectless.types';
import { OutcomeState } from './outcome-state';
import { isPromiseLike } from './utils';

export class Outcome<R, E> extends AbstractOutcome<R, E> {
  public static success<T = void, F = never>(): Outcome<T, F>;
  public static success<T, F = never>(value: T): Outcome<T, F>;
  public static success<T, F = never>(value?: T): Outcome<T, F> {
    return new Outcome(Promise.resolve(OutcomeState.success(value as T)));
  }

  public static failure<T = never, F = void>(): Outcome<T, F>;
  public static failure<T = never, F = unknown>(error: F): Outcome<T, F>;
  public static failure<T = never, F = unknown>(error?: F): Outcome<T, F> {
    return new Outcome(Promise.resolve(OutcomeState.failure(error as F, [])));
  }

  // TODO: move to global namespace
  public static fromSupplier<T, F>(
    supplier: () => T | PromiseLike<T>,
    errorFn?: (err: unknown) => F,
  ): Outcome<T, F> {
    return Outcome.fromFunction<T, () => T | PromiseLike<T>, F>(supplier, errorFn)();
  }

  // TODO: move to global namespace
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromFunction<T, Fn extends (...args: readonly any[]) => T | PromiseLike<T>, F>(
    producingFunction: Fn,
    errorFn?: (err: unknown) => F,
  ): (...args: Parameters<Fn>) => Outcome<T, F> {
    return (...args: Parameters<Fn>) => {
      try {
        const value = producingFunction(...args);

        if (isPromiseLike(value)) {
          return new Outcome(
            new Promise<OutcomeState<T, F>>((resolve) => {
              value.then(
                (val) => {
                  resolve(OutcomeState.success(val));
                },
                (err) => {
                  if (errorFn) {
                    try {
                      resolve(OutcomeState.failure(errorFn(err), []));
                    } catch (errorFnCause) {
                      resolve(OutcomeState.defect(errorFnCause));
                    }
                  } else {
                    resolve(OutcomeState.defect(err));
                  }
                },
              );
            }),
          );
        } else {
          return Outcome.success(value);
        }
      } catch (producingFunctionCause) {
        if (errorFn) {
          try {
            const error = errorFn(producingFunctionCause);
            return Outcome.failure(error);
          } catch (errorFnCause) {
            return Outcome.defect(errorFnCause);
          }
        } else {
          return Outcome.defect(producingFunctionCause);
        }
      }
    };
  }

  // TODO: move to global namespace
  public static all<
    O extends readonly [IOutcome<unknown, unknown>, ...IOutcome<unknown, unknown>[]],
  >(asyncResultList: O): CombinedOutcomes<O>;
  public static all<O extends readonly IOutcome<unknown, unknown>[]>(
    asyncResultList: O,
  ): CombinedOutcomes<O>;
  public static all<O extends readonly IOutcome<unknown, unknown>[]>(
    asyncResultList: O,
  ): CombinedOutcomes<O> {
    const promises = asyncResultList.map((outcome) =>
      AbstractOutcome.toPromise(outcome as AbstractOutcome<unknown, unknown>),
    ) as CombinedPromises<O>;

    const all = Promise.all(promises).then((states) => {
      const results: unknown[] = [];
      const failures: unknown[] = [];
      const suppressed: unknown[] = [];
      let defect: unknown | undefined;

      for (let i = 0; i < states.length; i++) {
        const state = states[i];

        if (state.isSuccess()) {
          results[i] = state.value;
        } else if (state.isFailure()) {
          failures[i] = state.error;
          suppressed.push(...state.suppressed);
        } else {
          defect = state.defect;
          break;
        }
      }

      const isFailed = failures.some((failure) => !!failure);

      if (defect) {
        return OutcomeState.defect(defect);
      } else if (isFailed) {
        return OutcomeState.failure(failures, suppressed);
      } else {
        return OutcomeState.success(results);
      }
    });

    return new Outcome(all) as unknown as CombinedOutcomes<O>;
  }

  constructor(promise: Promise<OutcomeState<R, E>>) {
    super(promise);
  }

  public map<T>(transformer: (value: R) => T): Outcome<T, E> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<T, E>;
        }

        if (state.isFailure()) {
          return state as unknown as OutcomeState<T, E>;
        }

        try {
          const newValue = transformer(state.value!);
          return OutcomeState.success(newValue);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public tap(consumer: (value: R) => void): Outcome<R, E> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state;
        }

        if (state.isFailure()) {
          return state;
        }

        try {
          consumer(state.value!);
          return state;
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public mapFailure<F>(errorTransformer: (error: E) => F): Outcome<R, F> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<R, F>;
        }

        if (state.isSuccess()) {
          return state as unknown as OutcomeState<R, F>;
        }

        try {
          const newError = errorTransformer(state.error!);
          return OutcomeState.failure(newError, state.suppressed as unknown as F[]);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public tapFailure(errorConsumer: (error: E) => void): Outcome<R, E> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state;
        }

        if (state.isSuccess()) {
          return state;
        }

        try {
          errorConsumer(state.error!);
          return state;
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public recover<O extends IOutcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): Outcome<R, InferFailureTypes<O>>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | IOutcome<R, F>,
  ): Outcome<R, E | F>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | IOutcome<R, F>,
  ): Outcome<R, E | F> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<R, E | F>;
        }

        if (state.isSuccess()) {
          return state as unknown as OutcomeState<R, E | F>;
        }

        try {
          const newValue = recoverer(state.error!, state.suppressed);
          return newValue instanceof AbstractOutcome
            ? AbstractOutcome.toPromise<R, F>(newValue)
            : OutcomeState.success(newValue as R);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public flatMap<O extends IOutcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<InferResultTypes<O>, InferFailureTypes<O>>;
  public flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): Outcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): Outcome<T, E | F> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<T, E | F>;
        }

        if (state.isFailure()) {
          return state as unknown as OutcomeState<T, E | F>;
        }

        try {
          const newValue = operation(state.value!);
          return AbstractOutcome.toPromise<T, F>(newValue as AbstractOutcome<T, F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public through<O extends IOutcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<R, InferFailureTypes<O>>;
  public through<F>(operation: (value: R) => IOutcome<unknown, F>): Outcome<R, E | F>;
  public through<F>(operation: (value: R) => IOutcome<unknown, F>): Outcome<R, E | F> {
    return new Outcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state;
        }

        if (state.isFailure()) {
          return state;
        }

        try {
          const result = operation(state.value!).map((_) => state.value!);
          return AbstractOutcome.toPromise(result as AbstractOutcome<R, E | F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public finally<F>(finalization: () => IOutcome<unknown, F>): Outcome<R, E | F> {
    return new Outcome(
      this.promise.then(async (state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<R, E | F>;
        }

        try {
          const result = finalization()
            .recover((finalizationError, finalizationSuppressed) => {
              if (state.isSuccess()) {
                return Outcome.failure(finalizationError);
              } else {
                return new Outcome(
                  Promise.resolve(
                    OutcomeState.failure(state.error!, [
                      ...state.suppressed,
                      finalizationError,
                      ...finalizationSuppressed,
                    ]),
                  ),
                );
              }
            })
            .map((_) => state.value!);

          return AbstractOutcome.toPromise(result as AbstractOutcome<R, E | F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  private static defect<T = never, E = never>(cause: unknown): Outcome<T, E> {
    return new Outcome(Promise.resolve(OutcomeState.defect(cause)));
  }
}

export const success = Outcome.success;
export const failure = Outcome.failure;

// Given a list of Outcomes, this extracts all typed Promises from that list
type CombinedPromises<T extends readonly IOutcome<unknown, unknown>[]> = {
  [K in keyof T]: Promise<
    OutcomeState<
      T[K] extends IOutcome<infer R, unknown> ? R : never,
      T[K] extends IOutcome<unknown, infer E> ? E : never
    >
  >;
};
