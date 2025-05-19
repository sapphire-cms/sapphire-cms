import { OutcomeState } from './outcome-state';
import type {
  Combine,
  EmptyArrayToNever,
  IsLiteralArray,
  MemberListOf,
  MembersToUnion,
} from './result';
import { combineResultList, err, ok } from './result';
import { isPromiseLike } from './utils';

export class Outcome<R, E> {
  // TODO: try to simplify
  public static success<T, F = never>(value: T): Outcome<T, F>;
  public static success<T extends void = void, F = never>(value: void): Outcome<T, F>;
  public static success<T, F = never>(value: T): Outcome<T, F> {
    return new Outcome(Promise.resolve(OutcomeState.success(value)));
  }

  // TODO: try to simplify
  public static failure<T = never, F = unknown>(error: F): Outcome<T, F>;
  public static failure<T = never, F extends void = void>(error: void): Outcome<T, F>;
  public static failure<T = never, F = unknown>(error: F): Outcome<T, F> {
    return new Outcome(Promise.resolve(OutcomeState.failure(error, [])));
  }

  public static fromSupplier<T, F>(
    supplier: () => T | PromiseLike<T>,
    errorFn?: (err: unknown) => F,
  ): Outcome<T, F> {
    return Outcome.fromFunction(supplier, errorFn)();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromFunction<A extends readonly any[], T, F>(
    producingFunction: (...args: A) => T | PromiseLike<T>,
    errorFn?: (err: unknown) => F,
  ): (...args: A) => Outcome<T, F> {
    return (...args: A) => {
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

  // TODO: to remake, we should never loose errors
  public static combine<
    T extends readonly [Outcome<unknown, unknown>, ...Outcome<unknown, unknown>[]],
  >(asyncResultList: T): CombinedOutcomes<T>;
  public static combine<T extends readonly Outcome<unknown, unknown>[]>(
    asyncResultList: T,
  ): CombinedOutcomes<T>;
  public static combine<T extends readonly Outcome<unknown, unknown>[]>(
    asyncResultList: T,
  ): CombinedOutcomes<T> {
    const promises = asyncResultList.map((outcome) => outcome.promise) as CombinedPromises<T>;
    const all = Promise.all(promises)
      .then((states) => {
        return states.map((state) => {
          if (state.isSuccess()) {
            return ok(state.value);
          } else if (state.isFailure()) {
            return err(state.error);
          } else {
            return err('defect');
          }
        });
      })
      .then(combineResultList)
      .then((resultList) => {
        if (resultList.isOk()) {
          return OutcomeState.success(resultList.value);
        } else {
          return OutcomeState.failure(resultList.error, []);
        }
      });
    return new Outcome(all) as CombinedOutcomes<T>;
  }

  constructor(private readonly promise: Promise<OutcomeState<R, E>>) {}

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

  public recover<O extends Outcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): Outcome<R, InferAsyncErrTypes<O>>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | Outcome<R, F>,
  ): Outcome<R, E | F>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | Outcome<R, F>,
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
          return newValue instanceof Outcome ? newValue.promise : OutcomeState.success(newValue);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public flatMap<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<InferAsyncOkTypes<O>, InferAsyncErrTypes<O>>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F> {
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
          return newValue.promise;
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<R, InferAsyncErrTypes<O>>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F> {
    return new Outcome(
      this.promise.then(async (state) => {
        if (state.isDefect()) {
          return state;
        }

        if (state.isFailure()) {
          return state;
        }

        try {
          const result = operation(state.value!);
          let newError: F | undefined;
          let operationDefect: unknown | undefined;

          await result.match(
            () => {},
            (err: F) => {
              newError = err;
            },
            (defect) => {
              operationDefect = defect;
            },
          );

          if (operationDefect) {
            return OutcomeState.defect(operationDefect);
          } else if (newError) {
            return OutcomeState.failure(newError, []);
          } else {
            return state;
          }
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F> {
    return new Outcome(
      this.promise.then(async (state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<R, E | F>;
        }

        try {
          const result = finalization();
          let finalizationError: F | undefined;
          let finalizationDefect: unknown | undefined;

          await result.match(
            () => {},
            (err: F) => {
              finalizationError = err;
            },
            (defect) => {
              finalizationDefect = defect;
            },
          );

          if (finalizationDefect) {
            return OutcomeState.defect(finalizationDefect);
          } else if (finalizationError) {
            if (state.isSuccess()) {
              return OutcomeState.failure(finalizationError, []);
            } else {
              return OutcomeState.failure(state.error!, [...state.suppressed, finalizationError]);
            }
          } else {
            return state;
          }
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public match(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    defect: (cause: unknown) => void,
  ): Promise<void> {
    return this.promise.then((state) => {
      if (state.isSuccess()) {
        success(state.value!);
      } else if (state.isFailure()) {
        failure(state.error!, state.suppressed);
      } else {
        defect(state.defect!);
      }
    });
  }

  private static defect<T = never, E = never>(cause: unknown): Outcome<T, E> {
    return new Outcome(Promise.resolve(OutcomeState.defect(cause)));
  }
}

export const success = Outcome.success;
export const failure = Outcome.failure;

export class CombinedError<PE, FE> extends Error {
  public readonly _tag = 'CombinedError';

  constructor(
    public readonly programError: PE,
    public readonly finalizationError: FE,
  ) {
    super('Both program and finalization have failed');
  }
}

// Given a list of Outcomes, this extracts all the different `T` types from that list
export type ExtractOkAsyncTypes<T extends readonly Outcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Outcome<infer U, unknown> ? U : never;
};

// Given a list of Outcomes, this extracts all the different `E` types from that list
export type ExtractErrAsyncTypes<T extends readonly Outcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends Outcome<unknown, infer E> ? E : never;
};

type CombinedPromises<T extends readonly Outcome<unknown, unknown>[]> = {
  [K in keyof T]: Promise<
    OutcomeState<
      T[K] extends Outcome<infer R, unknown> ? R : never,
      T[K] extends Outcome<unknown, infer E> ? E : never
    >
  >;
};

export type InferAsyncOkTypes<R> = R extends Outcome<infer T, unknown> ? T : never;
export type InferAsyncErrTypes<R> = R extends Outcome<unknown, infer E> ? E : never;

// Combines the array of async results into one result.
export type CombinedOutcomes<T extends readonly Outcome<unknown, unknown>[]> =
  IsLiteralArray<T> extends 1
    ? TraverseAsync<UnwrapAsync<T>>
    : Outcome<ExtractOkAsyncTypes<T>, ExtractErrAsyncTypes<T>[number]>;

// Unwraps the inner `Result` from a `Outcome` for all elements.
type UnwrapAsync<T> =
  IsLiteralArray<T> extends 1
    ? Writable<T> extends [infer H, ...infer _Rest]
      ? H extends Outcome<infer HI, unknown>
        ? HI
        : never
      : []
    : // If we got something too general such as Outcome<X, Y>[] then we
      // simply need to map it to Outcome<X[], Y[]>. Yet `Outcome`
      // itself is a union therefore it would be enough to cast it to Ok.
      T extends Array<infer A>
      ? A extends Outcome<infer HI, unknown>
        ? HI
        : never
      : never;

// Traverse through the tuples of the async results and create one
// `Outcome` where the collected tuples are merged.
type TraverseAsync<T, Depth extends number = 5> =
  IsLiteralArray<T> extends 1
    ? Combine<T, Depth> extends [infer Oks, infer Errs]
      ? Outcome<EmptyArrayToNever<Oks>, MembersToUnion<Errs>>
      : never
    : // The following check is important if we somehow reach to the point of
      // checking something similar to Outcome<X, Y>[]. In this case we don't
      // know the length of the elements, therefore we need to traverse the X and Y
      // in a way that the result should contain X[] and Y[].
      T extends Array<infer I>
      ? // The MemberListOf<I> here is to include all possible types. Therefore
        // if we face (Outcome<X, Y> | Outcome<A, B>)[] this type should
        // handle the case.
        Combine<MemberListOf<I>, Depth> extends [infer Oks, infer Errs]
        ? // The following `extends unknown[]` checks are just to satisfy the TS.
          // we already expect them to be an array.
          Oks extends unknown[]
          ? Errs extends unknown[]
            ? Outcome<EmptyArrayToNever<Oks[number][]>, MembersToUnion<Errs[number][]>>
            : Outcome<EmptyArrayToNever<Oks[number][]>, Errs>
          : // The rest of the conditions are to satisfy the TS and support
            // the edge cases which are not really expected to happen.
            Errs extends unknown[]
            ? Outcome<Oks, MembersToUnion<Errs[number][]>>
            : Outcome<Oks, Errs>
        : never
      : never;

// Converts a readonly array into a writable array
type Writable<T> = T extends ReadonlyArray<unknown> ? [...T] : T;
