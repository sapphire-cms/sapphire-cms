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
import { OutcomeState } from './outcome-state';
import { Combine, EmptyArrayToNever, IsLiteralArray, MemberListOf, MembersToUnion } from './result';

export interface IOutcome<R, E> {
  // TODO: remove it later
  promise: Promise<OutcomeState<R, E>>;

  // Any error in transformer function becomes a defect
  map<T>(transformer: (value: R) => T): IOutcome<T, E>;

  // Any error in consumer function becomes a defect
  tap(consumer: (value: R) => void): IOutcome<R, E>;

  // Any error in errorTransformer function becomes a defect
  mapFailure<F>(errorTransformer: (error: E) => F): IOutcome<R, F>;

  // Any error in errorConsumer function becomes a defect
  tapFailure(errorConsumer: (error: E) => void): IOutcome<R, E>;

  // Any error in recoverer function becomes a defect
  recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | IOutcome<R, F>,
  ): IOutcome<R, E | F>;

  // Any error in operation function becomes a defect
  flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): IOutcome<T, E | F>;

  // Any error in operation function becomes a defect
  through<F>(operation: (value: R) => IOutcome<unknown, F>): IOutcome<R, E | F>;

  // Any error in finalization function becomes a defect
  finally<F>(finalization: () => IOutcome<unknown, F>): IOutcome<R, E | F>;

  // Errors in match operation will not be handled
  match(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    defect: (cause: unknown) => void,
  ): Promise<void>;
}

// Given a list of Outcomes, this extracts all the different `T` types from that list
export type ExtractResultTypes<T extends readonly IOutcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends IOutcome<infer U, unknown> ? U : never;
};

// Given a list of Outcomes, this extracts all the different `E` types from that list
export type ExtractFailureTypes<T extends readonly IOutcome<unknown, unknown>[]> = {
  [idx in keyof T]: T[idx] extends IOutcome<unknown, infer E> ? E : never;
};

export type InferResultTypes<R> = R extends IOutcome<infer T, unknown> ? T : never;
export type InferFailureTypes<R> = R extends IOutcome<unknown, infer E> ? E : never;

// Combines the array of Outcomes into one Outcome.
export type CombinedOutcomes<T extends readonly IOutcome<unknown, unknown>[]> =
  IsLiteralArray<T> extends 1
    ? TraverseAsync<UnwrapAsync<T>>
    : IOutcome<ExtractResultTypes<T>, ExtractFailureTypes<T>[number]>;

// Unwraps the inner `Result` from a `Outcome` for all elements.
type UnwrapAsync<T> =
  IsLiteralArray<T> extends 1
    ? Writable<T> extends [infer H, ...infer _Rest]
      ? H extends IOutcome<infer HI, unknown>
        ? HI
        : never
      : []
    : // If we got something too general such as Outcome<X, Y>[] then we
      // simply need to map it to Outcome<X[], Y[]>. Yet `Outcome`
      // itself is a union therefore it would be enough to cast it to Ok.
      T extends Array<infer A>
      ? A extends IOutcome<infer HI, unknown>
        ? HI
        : never
      : never;

// Traverse through the tuples of the async results and create one
// `Outcome` where the collected tuples are merged.
type TraverseAsync<T, Depth extends number = 5> =
  IsLiteralArray<T> extends 1
    ? Combine<T, Depth> extends [infer Oks, infer Errs]
      ? IOutcome<EmptyArrayToNever<Oks>, MembersToUnion<Errs>>
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
            ? IOutcome<EmptyArrayToNever<Oks[number][]>, MembersToUnion<Errs[number][]>>
            : IOutcome<EmptyArrayToNever<Oks[number][]>, Errs>
          : // The rest of the conditions are to satisfy the TS and support
            // the edge cases which are not really expected to happen.
            Errs extends unknown[]
            ? IOutcome<Oks, MembersToUnion<Errs[number][]>>
            : IOutcome<Oks, Errs>
        : never
      : never;

// Converts a readonly array into a writable array
type Writable<T> = T extends ReadonlyArray<unknown> ? [...T] : T;
