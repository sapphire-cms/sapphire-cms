import { AsyncOutcome } from './async-outcome';
import {
  ExtractFailureTypesOptional,
  ExtractResultTypes,
  InferFailureTypes,
  InferResultTypes,
} from './defectless.types';
import { OutcomeState } from './outcome-state';
import { SyncOutcome } from './sync-outcome';
import { isPromiseLike } from './utils';

export interface Outcome<R, E> {
  // Any error in transformer function becomes a defect
  map<T>(transformer: (value: R) => T): Outcome<T, E>;

  // Any error in consumer function becomes a defect
  tap(consumer: (value: R) => void): Outcome<R, E>;

  // Any error in errorTransformer function becomes a defect
  mapFailure<F>(errorTransformer: (error: E) => F): Outcome<R, F>;

  // Any error in errorConsumer function becomes a defect
  tapFailure(errorConsumer: (error: E) => void): Outcome<R, E>;

  // Any error in recoverer function becomes a defect
  recover<O extends Outcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): AsyncOutcome<R, InferFailureTypes<O>>;
  recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | Outcome<R, F>,
  ): Outcome<R, E | F>;

  // Any error in operation function becomes a defect
  flatMap<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<InferResultTypes<O>, InferFailureTypes<O>>;
  flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;

  // Any error in operation function becomes a defect
  through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): AsyncOutcome<R, InferFailureTypes<O>>;
  through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;

  // Any error in finalization function becomes a defect
  finally<O extends Outcome<unknown, unknown>>(
    finalization: () => O,
  ): Outcome<R, InferFailureTypes<O>>;
  finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F>;

  // Errors in match operation will not be handled
  match(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    defect?: (cause: unknown) => void,
  ): Promise<void>;
}

function fromSupplier<T, F>(
  supplier: () => PromiseLike<T>,
  errorFn?: (err: unknown) => F,
): AsyncOutcome<T, F>;
function fromSupplier<T, F>(supplier: () => T, errorFn?: (err: unknown) => F): SyncOutcome<T, F>;
function fromSupplier<T, F>(
  supplier: () => T | PromiseLike<T>,
  errorFn?: (err: unknown) => F,
): Outcome<T, F>;
function fromSupplier<T, F>(
  supplier: () => T | PromiseLike<T>,
  errorFn?: (err: unknown) => F,
): Outcome<T, F> {
  return fromFunction(supplier, errorFn)() as Outcome<T, F>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFunction<Fn extends (...args: readonly any[]) => PromiseLike<any>, F>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => AsyncOutcome<Awaited<ReturnType<Fn>>, F>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFunction<Fn extends (...args: readonly any[]) => any, F>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => SyncOutcome<ReturnType<Fn>, F>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFunction<Fn extends (...args: readonly any[]) => any, F>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => Outcome<unknown, F>;

function fromFunction<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Fn extends (...args: readonly any[]) => any,
  T extends Awaited<ReturnType<Fn>>,
  F,
>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => Outcome<unknown, F> {
  return (...args: Parameters<Fn>) => {
    try {
      const value = producingFunction(...args);

      if (isPromiseLike(value)) {
        return AsyncOutcome.__INTERNAL__.create(
          new Promise<OutcomeState<T, F>>((resolve) => {
            value.then(
              (val) => {
                resolve(OutcomeState.success(val as T));
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
        return SyncOutcome.success(value);
      }
    } catch (producingFunctionCause) {
      if (errorFn) {
        try {
          const error = errorFn(producingFunctionCause);
          return SyncOutcome.failure(error);
        } catch (errorFnCause) {
          return SyncOutcome.__INTERNAL__.defect(errorFnCause);
        }
      } else {
        return SyncOutcome.__INTERNAL__.defect(producingFunctionCause);
      }
    }
  };
}

function all<
  O extends readonly [SyncOutcome<unknown, unknown>, ...SyncOutcome<unknown, unknown>[]],
>(syncOutcomeList: O): SyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
function all<O extends readonly SyncOutcome<unknown, unknown>[]>(
  syncOutcomeList: O,
): SyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
function all<O extends readonly [Outcome<unknown, unknown>, ...Outcome<unknown, unknown>[]]>(
  outcomeList: O,
): Outcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
function all<O extends readonly Outcome<unknown, unknown>[]>(
  outcomeList: O,
): Outcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
function all<O extends readonly Outcome<unknown, unknown>[]>(
  outcomeList: O,
): Outcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>> {
  const allSync = outcomeList.every((outcome) => outcome instanceof SyncOutcome);
  return allSync ? SyncOutcome.all(outcomeList) : AsyncOutcome.all(outcomeList);
}

export const Outcome = {
  fromSupplier,
  fromFunction,
  all,
  success: SyncOutcome.success,
  failure: SyncOutcome.failure,
};

export const success = Outcome.success;
export const failure = Outcome.failure;
