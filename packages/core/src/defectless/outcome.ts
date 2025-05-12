import {
  combineResultList,
  ExtractErrAsyncTypes,
  ExtractOkAsyncTypes,
  InferAsyncErrTypes,
  InferAsyncOkTypes,
  InferErrTypes,
  InferOkTypes,
} from './internals';
import type {
  Combine,
  EmptyArrayToNever,
  IsLiteralArray,
  MemberListOf,
  MembersToUnion,
} from './result';

import { Err, Ok, Result } from './';

export class Outcome<T, E> {
  private readonly promise: Promise<Result<T, E>>;

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
  >(asyncResultList: T): CombineResultAsyncs<T>;
  public static combine<T extends readonly Outcome<unknown, unknown>[]>(
    asyncResultList: T,
  ): CombineResultAsyncs<T>;
  public static combine<T extends readonly Outcome<unknown, unknown>[]>(
    asyncResultList: T,
  ): CombineResultAsyncs<T> {
    return Outcome.fromSupplier(
      () => Promise.all(asyncResultList.map((outcome) => outcome.promise)),
      (err) => failure(err),
    ).flatMap(combineResultList) as CombineResultAsyncs<T>;
  }

  constructor(res: Promise<Result<T, E>>) {
    this.promise = res;
  }

  public map<A>(transform: (val: T) => A | Promise<A>): Outcome<A, E> {
    return new Outcome(
      this.promise.then(async (res: Result<T, E>) => {
        if (res.isErr()) {
          return new Err<A, E>(res.error);
        }

        return new Ok<A, E>(await transform(res.value));
      }),
    );
  }

  public through<F>(
    consume: (val: T) => Result<unknown, F> | Outcome<unknown, F>,
  ): Outcome<T, E | F> {
    return new Outcome(
      this.promise.then(async (res: Result<T, E>) => {
        if (res.isErr()) {
          return res;
        }

        const newRes = consume(res.value);

        if (newRes instanceof Ok) {
          return res;
        } else if (newRes instanceof Err) {
          return newRes as Err<T, F>;
        } else {
          // Is Outcome
          return await (newRes as Outcome<unknown, F>).match(
            () => res,
            (err: F) => new Err<T, F>(err),
          );
        }
      }),
    );
  }

  public tap(f: (t: T) => unknown): Outcome<T, E> {
    return new Outcome(
      this.promise.then(async (res: Result<T, E>) => {
        if (res.isErr()) {
          return new Err<T, E>(res.error);
        }
        try {
          await f(res.value);
        } catch (_) {
          // Tee does not care about the error
        }
        return new Ok<T, E>(res.value);
      }),
    );
  }

  public tapFailure(f: (t: E) => unknown): Outcome<T, E> {
    return new Outcome(
      this.promise.then(async (res: Result<T, E>) => {
        if (res.isOk()) {
          return new Ok<T, E>(res.value);
        }
        try {
          await f(res.error);
        } catch (_) {
          // Tee does not care about the error
        }
        return new Err<T, E>(res.error);
      }),
    );
  }

  public mapFailure<U>(f: (e: E) => U | Promise<U>): Outcome<T, U> {
    return new Outcome(
      this.promise.then(async (res: Result<T, E>) => {
        if (res.isOk()) {
          return new Ok<T, U>(res.value);
        }

        return new Err<T, U>(await f(res.error));
      }),
    );
  }

  public flatMap<R extends Result<unknown, unknown>>(
    f: (t: T) => R,
  ): Outcome<InferOkTypes<R>, InferErrTypes<R> | E>;
  public flatMap<R extends Outcome<unknown, unknown>>(
    f: (t: T) => R,
  ): Outcome<InferAsyncOkTypes<R>, InferAsyncErrTypes<R> | E>;
  public flatMap<U, F>(f: (t: T) => Result<U, F> | Outcome<U, F>): Outcome<U, E | F>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public flatMap(f: any): any {
    return new Outcome(
      this.promise.then((res) => {
        if (res.isErr()) {
          return new Err<never, E>(res.error);
        }

        const newValue = f(res.value);
        return newValue instanceof Outcome ? newValue.promise : newValue;
      }),
    );
  }

  public recover<R extends Result<unknown, unknown>>(
    f: (e: E) => R,
  ): Outcome<InferOkTypes<R> | T, InferErrTypes<R>>;
  public recover<R extends Outcome<unknown, unknown>>(
    f: (e: E) => R,
  ): Outcome<InferAsyncOkTypes<R> | T, InferAsyncErrTypes<R>>;
  public recover<U, A>(f: (e: E) => Result<U, A> | Outcome<U, A>): Outcome<U | T, A>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
  public recover(f: any): any {
    return new Outcome(
      this.promise.then(async (res: Result<T, E>) => {
        if (res.isErr()) {
          const newRes = f(res.error);

          if (newRes instanceof Ok || newRes instanceof Err) {
            return newRes;
          } else {
            // Is Outcome
            return await (newRes as Outcome<unknown, unknown>).match(
              () => new Ok<unknown, unknown>(undefined),
              (err) => new Err<unknown, unknown>(err),
            );
          }
        }

        return new Ok<T, unknown>(res.value);
      }),
    );
  }

  public match<A, B = A>(ok: (t: T) => A, _err: (e: E) => B): Promise<A | B> {
    return this.promise.then((res) => res.match(ok, _err));
  }

  public unwrapOr<A>(t: A): Promise<T | A> {
    return this.promise.then((res) => res.unwrapOr(t));
  }

  public finally<FE>(
    finalization: () => Outcome<void, FE>,
  ): Outcome<T, E | FE | CombinedError<E, FE>> {
    return Outcome.fromSupplier<T, E | FE | CombinedError<E, FE>>(
      () =>
        new Promise<T>((resolve, reject) => {
          this.match(
            async (result) => {
              await finalization().match(
                () => resolve(result as T),
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

  public async *[Symbol.asyncIterator](): AsyncGenerator<Err<never, E>, T> {
    const result = await this.promise;

    if (result.isErr()) {
      // @ts-expect-error -- This is structurally equivalent and safe
      yield failure(result.error);
    }

    // @ts-expect-error -- This is structurally equivalent and safe
    return result.value;
  }
}

export const success = Outcome.success;
export const failure = Outcome.failure;

export const fromAsyncThrowable = Outcome.fromFunction;

export class CombinedError<PE, FE> extends Error {
  public readonly _tag = 'CombinedError';

  constructor(
    public readonly programError: PE,
    public readonly finalizationError: FE,
  ) {
    super('Both program and finalization have failed');
  }
}

// Combines the array of async results into one result.
export type CombineResultAsyncs<T extends readonly Outcome<unknown, unknown>[]> =
  IsLiteralArray<T> extends 1
    ? TraverseAsync<UnwrapAsync<T>>
    : Outcome<ExtractOkAsyncTypes<T>, ExtractErrAsyncTypes<T>[number]>;

// Combines the array of async results into one result with all errors.
export type CombineResultsWithAllErrorsArrayAsync<T extends readonly Outcome<unknown, unknown>[]> =
  IsLiteralArray<T> extends 1
    ? TraverseWithAllErrorsAsync<UnwrapAsync<T>>
    : Outcome<ExtractOkAsyncTypes<T>, ExtractErrAsyncTypes<T>[number][]>;

// Unwraps the inner `Result` from a `ResultAsync` for all elements.
type UnwrapAsync<T> =
  IsLiteralArray<T> extends 1
    ? Writable<T> extends [infer H, ...infer _Rest]
      ? H extends Outcome<infer HI, unknown>
        ? HI
        : never
      : []
    : // If we got something too general such as ResultAsync<X, Y>[] then we
      // simply need to map it to ResultAsync<X[], Y[]>. Yet `ResultAsync`
      // itself is a union therefore it would be enough to cast it to Ok.
      T extends Array<infer A>
      ? A extends Outcome<infer HI, unknown>
        ? HI
        : never
      : never;

// Traverse through the tuples of the async results and create one
// `ResultAsync` where the collected tuples are merged.
type TraverseAsync<T, Depth extends number = 5> =
  IsLiteralArray<T> extends 1
    ? Combine<T, Depth> extends [infer Oks, infer Errs]
      ? Outcome<EmptyArrayToNever<Oks>, MembersToUnion<Errs>>
      : never
    : // The following check is important if we somehow reach to the point of
      // checking something similar to ResultAsync<X, Y>[]. In this case we don't
      // know the length of the elements, therefore we need to traverse the X and Y
      // in a way that the result should contain X[] and Y[].
      T extends Array<infer I>
      ? // The MemberListOf<I> here is to include all possible types. Therefore
        // if we face (ResultAsync<X, Y> | ResultAsync<A, B>)[] this type should
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

// This type is similar to the `TraverseAsync` while the errors are also
// collected in a list. For the checks/conditions made here, see that type
// for the documentation.
type TraverseWithAllErrorsAsync<T, Depth extends number = 5> =
  TraverseAsync<T, Depth> extends Outcome<infer Oks, infer Errs> ? Outcome<Oks, Errs[]> : never;

// Converts a readonly array into a writable array
type Writable<T> = T extends ReadonlyArray<unknown> ? [...T] : T;
