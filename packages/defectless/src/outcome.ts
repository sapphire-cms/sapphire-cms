import type {
  Combine,
  EmptyArrayToNever,
  IsLiteralArray,
  MemberListOf,
  MembersToUnion,
} from './result';
import { combineResultList, Err, Ok, Result } from './result';

export class Outcome<R, E> {
  private readonly promise: Promise<Result<R, E>>;

  public static success<T, E = never>(value: T): Outcome<T, E>;
  public static success<T extends void = void, E = never>(value: void): Outcome<T, E>;
  public static success<T, E = never>(value: T): Outcome<T, E> {
    return new Outcome(Promise.resolve(new Ok<T, E>(value)));
  }

  public static failure<T = never, E = unknown>(err: E): Outcome<T, E>;
  public static failure<T = never, E extends void = void>(err: void): Outcome<T, E>;
  public static failure<T = never, E = unknown>(err: E): Outcome<T, E> {
    return new Outcome(Promise.resolve(new Err<T, E>(err)));
  }

  public static fromSupplier<T, E>(
    supplier: () => Promise<T>,
    errorFn: (e: unknown) => E,
  ): Outcome<T, E> {
    const newPromise = supplier()
      .then((value: T) => new Ok<T, E>(value))
      .catch((e) => new Err<T, E>(errorFn(e)));

    return new Outcome(newPromise);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromFunction<A extends readonly any[], R, E>(
    fn: (...args: A) => Promise<R>,
    errorFn?: (err: unknown) => E,
  ): (...args: A) => Outcome<R, E> {
    return (...args: A) => {
      return new Outcome<R, E>(
        (async () => {
          try {
            return new Ok<R, E>(await fn(...args));
          } catch (error) {
            return new Err<R, E>(errorFn ? errorFn(error) : (error as E));
          }
        })(),
      );
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
    const all = Promise.all(promises).then(combineResultList);
    return new Outcome(all) as CombinedOutcomes<T>;
  }

  constructor(res: Promise<Result<R, E>>) {
    this.promise = res;
  }

  public map<T>(transformer: (value: R) => T): Outcome<T, E> {
    return new Outcome(
      this.promise.then((res: Result<R, E>) => {
        if (res.isErr()) {
          return new Err<T, E>(res.error);
        }

        const newValue = transformer(res.value);
        return new Ok<T, E>(newValue);
      }),
    );
  }

  public tap(consumer: (value: R) => void): Outcome<R, E> {
    return new Outcome(
      this.promise.then((res: Result<R, E>) => {
        if (res.isErr()) {
          return new Err<R, E>(res.error);
        }

        consumer(res.value);

        return new Ok<R, E>(res.value);
      }),
    );
  }

  public mapFailure<F>(errorTransformer: (error: E) => F): Outcome<R, F> {
    return new Outcome(
      this.promise.then(async (res: Result<R, E>) => {
        if (res.isOk()) {
          return new Ok<R, F>(res.value);
        }

        const newError = errorTransformer(res.error);
        return new Err<R, F>(newError);
      }),
    );
  }

  public tapFailure(errorConsumer: (error: E) => void): Outcome<R, E> {
    return new Outcome(
      this.promise.then(async (res: Result<R, E>) => {
        if (res.isOk()) {
          return new Ok<R, E>(res.value);
        }

        errorConsumer(res.error);

        return new Err<R, E>(res.error);
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
      this.promise.then(async (res: Result<R, E>) => {
        if (res.isErr()) {
          const newRes = recoverer(res.error, []);

          return newRes instanceof Outcome ? newRes.promise : Promise.resolve(new Ok<R, E>(newRes));
        }

        return new Ok<R, E>(res.value);
      }),
    );
  }

  public flatMap<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<InferAsyncOkTypes<O>, InferAsyncErrTypes<O>>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F> {
    return new Outcome(
      this.promise.then(async (res) => {
        if (res.isErr()) {
          return new Err<never, E>(res.error);
        }

        const newValue = operation(res.value);
        return newValue.promise;
      }),
    );
  }

  public through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<R, InferAsyncErrTypes<O>>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F> {
    return new Outcome(
      this.promise.then(async (res: Result<R, E>) => {
        if (res.isErr()) {
          return res;
        }

        const newRes = operation(res.value);
        let newError: Err<R, F> | undefined;

        await newRes.match(
          () => {},
          (err: F) => (newError = new Err<R, F>(err)),
        );

        return newError ? newError : res;
      }),
    );
  }

  public finally<FE>(
    finalization: () => Outcome<void, FE>,
  ): Outcome<R, E | FE | CombinedError<E, FE>> {
    return Outcome.fromSupplier<R, E | FE | CombinedError<E, FE>>(
      () =>
        new Promise<R>((resolve, reject) => {
          this.match(
            async (result) => {
              await finalization().match(
                () => resolve(result as R),
                (finalizationError: FE) => reject(finalizationError),
              );
            },
            async (error) => {
              await finalization().match(
                () => reject(error),
                (finalizationError: FE) => reject(new CombinedError(error, finalizationError)),
              );
            },
          );
        }),
      (err) => err as E | FE | CombinedError<E, FE>,
    );
  }

  public match(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    _defect?: (cause: unknown) => void,
  ): Promise<void> {
    return this.promise.then((res) => {
      if (res.isOk()) {
        success(res.value);
      } else {
        failure(res.error, []);
      }
    });
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
    Result<
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
