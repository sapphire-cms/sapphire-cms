import { _createAsync, AsyncOutcome } from './async-outcome';
import {
  ExtractFailureTypesOptional,
  ExtractResultTypes,
  InferFailureTypes,
  InferResultTypes,
} from './defectless.types';
import { OutcomeState } from './outcome-state';
import { _defect, SyncOutcome } from './sync-outcome';
import { isPromiseLike } from './utils';

export interface Outcome<R, E> {
  map<T>(transformer: (value: R) => T): Outcome<T, E>;

  tap(consumer: (value: R) => void): Outcome<R, E>;

  mapFailure<F>(errorTransformer: (error: E) => F): Outcome<R, F>;

  tapFailure(errorConsumer: (error: E) => void): Outcome<R, E>;

  recover<O extends Outcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): Outcome<R, InferFailureTypes<O>>;
  recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | Outcome<R, F>,
  ): Outcome<R, F>;

  flatMap<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<InferResultTypes<O>, E | InferFailureTypes<O>>;
  flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;

  through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<R, E | InferFailureTypes<O>>;
  through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;

  finally<O extends Outcome<unknown, unknown>>(
    finalization: () => O,
  ): Outcome<R, E | InferFailureTypes<O>>;
  finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F>;

  match(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    defect?: (cause: unknown) => void,
  ): Promise<void>;
}

/**
 * Creates an Outcome from a supplier function that may return a value or promise.
 *
 * This function safely executes a supplier function and wraps the result in an appropriate
 * Outcome type. If the supplier returns a promise, an AsyncOutcome is created; otherwise,
 * a SyncOutcome is returned. Any exceptions thrown by the supplier are captured and handled
 * according to the provided error transformation function.
 *
 * **Return Type Determination:**
 * - If supplier returns a PromiseLike: Returns AsyncOutcome<T, F>
 * - If supplier returns a regular value: Returns SyncOutcome<T, F>
 *
 * **Error Handling:**
 * - If supplier throws and errorFn is provided: Creates failure outcome with transformed error
 * - If supplier throws and no errorFn: Creates defect outcome with original exception
 * - If errorFn itself throws: Creates defect outcome with errorFn exception
 *
 * @template T The type of the value produced by the supplier
 * @template F The type of the transformed error when errorFn is provided
 * @param supplier A function that produces a value or promise, executed immediately
 * @param errorFn Optional function to transform caught exceptions into typed errors
 * @returns An Outcome wrapping the supplier's result or any exceptions
 *
 * @example
 * ```typescript
 * // Synchronous supplier
 * const syncOutcome = Outcome.fromSupplier(() => "hello");
 * // syncOutcome is SyncOutcome<string, never> containing "hello"
 *
 * // Asynchronous supplier
 * const asyncOutcome = Outcome.fromSupplier(() => Promise.resolve(42));
 * // asyncOutcome is AsyncOutcome<number, never> containing 42
 *
 * // With error transformation
 * const withErrorFn = Outcome.fromSupplier(
 *   () => JSON.parse("invalid json"),
 *   (err) => `Parse error: ${err.message}`
 * );
 * // withErrorFn is SyncOutcome<any, string> containing failure "Parse error: ..."
 *
 * // Without error transformation (creates defect)
 * const withoutErrorFn = Outcome.fromSupplier(() => JSON.parse("invalid json"));
 * // withoutErrorFn is SyncOutcome<any, never> containing defect with SyntaxError
 *
 * // Async with error handling
 * const asyncWithError = Outcome.fromSupplier(
 *   () => fetch("/api/users"),
 *   (err) => ({ code: "NETWORK_ERROR", message: err.message })
 * );
 * // asyncWithError is AsyncOutcome<any, {code: string, message: string}>
 * ```
 */
function fromSupplier<T, F = never>(
  supplier: () => PromiseLike<T>,
  errorFn?: (err: unknown) => F,
): AsyncOutcome<T, F>;
function fromSupplier<T, F = never>(
  supplier: () => T,
  errorFn?: (err: unknown) => F,
): SyncOutcome<T, F>;
function fromSupplier<T, F = never>(
  supplier: () => T | PromiseLike<T>,
  errorFn?: (err: unknown) => F,
): Outcome<T, F> {
  return fromFunction(supplier, errorFn)() as Outcome<T, F>;
}

/**
 * Transforms a function into factory to create Outcomes.
 *
 * fromFunction wraps an invocation of any function, and transforms the result it produces into Outcome of the
 * appropriate Outcome type. The wrapper function preserves the original function's parameter types.
 *
 * **Return Type Determination:**
 * - If wrapped function returns a PromiseLike: Wrapper returns AsyncOutcome<T, F>
 * - If wrapped function returns a regular value: Wrapper returns SyncOutcome<T, F>
 *
 * **Error Handling:**
 * - If wrapped function throws and errorFn is provided: Creates failure outcome with transformed error
 * - If wrapped function throws and no errorFn: Creates defect outcome with original exception
 * - If promise rejection occurs and errorFn is provided: Creates failure outcome with transformed error
 * - If promise rejection occurs and no errorFn: Creates defect outcome with rejection reason
 * - If errorFn itself throws: Creates defect outcome with errorFn exception
 *
 * @template Fn The type of the function to wrap
 * @template F The type of the transformed error when errorFn is provided
 * @param producingFunction The function to wrap in Outcome handling
 * @param errorFn Optional function to transform caught exceptions into typed errors
 * @returns A new function with the same parameters but wrapped return type
 *
 * @example
 * ```typescript
 * // Wrapping a synchronous function
 * const safeDivide = Outcome.fromFunction(
 *   (a: number, b: number) => a / b,
 *   (err) => "Division error"
 * );
 * const result = safeDivide(10, 2); // SyncOutcome<number, string> containing 5
 *
 * // Wrapping an async function
 * const safeApiCall = Outcome.fromFunction(
 *   async (url: string) => fetch(url).then(r => r.json()),
 *   (err) => ({ code: "API_ERROR", message: err.message })
 * );
 * const apiResult = safeApiCall("/users"); // AsyncOutcome<any, {code: string, message: string}>
 *
 * // Without error transformation
 * const parseJson = Outcome.fromFunction(JSON.parse);
 * const parsed = parseJson("invalid json"); // SyncOutcome<any, never> containing defect
 *
 * // Function that might throw
 * const riskyCalculation = Outcome.fromFunction(
 *   (x: number) => {
 *     if (x < 0) throw new Error("Negative not allowed");
 *     return Math.sqrt(x);
 *   },
 *   (err) => `Calculation failed: ${err.message}`
 * );
 * const calc1 = riskyCalculation(9);  // SyncOutcome<number, string> containing 3
 * const calc2 = riskyCalculation(-1); // SyncOutcome<number, string> containing failure
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFunction<Fn extends (...args: readonly any[]) => PromiseLike<any>, F = never>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => AsyncOutcome<Awaited<ReturnType<Fn>>, F>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromFunction<Fn extends (...args: readonly any[]) => any, F = never>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => SyncOutcome<ReturnType<Fn>, F>;

function fromFunction<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Fn extends (...args: readonly any[]) => any,
  T extends Awaited<ReturnType<Fn>>,
  F = never,
>(
  producingFunction: Fn,
  errorFn?: (err: unknown) => F,
): (...args: Parameters<Fn>) => Outcome<unknown, F> {
  return (...args: Parameters<Fn>) => {
    try {
      const value = producingFunction(...args);

      if (isPromiseLike(value)) {
        return AsyncOutcome[_createAsync](
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
          return SyncOutcome[_defect](errorFnCause);
        }
      } else {
        return SyncOutcome[_defect](producingFunctionCause);
      }
    }
  };
}

/**
 * Combines multiple Outcomes into a single Outcome containing all results or failures.
 *
 * This method follows "fail-fast" behavior: if any outcome is a defect, it returns immediately with that defect.
 * If any outcomes are failures, it collects all failures and returns a failed outcome.
 * Only if all outcomes are successful does it return a successful outcome with all results.
 *
 * Combines both heterogeneous and homogeneous lists. This means that you can have lists that contain outcomes with
 * different types of results and failures.
 *
 * **Return Type Determination:**
 * - If all inputs are SyncOutcomes: Returns SyncOutcome with array of results
 * - If any input is AsyncOutcome: Returns AsyncOutcome with array of results
 *
 * @template O The array type of Outcomes to combine
 * @param outcomeList Array of Outcomes to combine
 * @returns A single Outcome containing all results or any failures
 *
 * @example
 * ```typescript
 * // All synchronous outcomes
 * const sync1 = SyncOutcome.success(1);
 * const sync2 = SyncOutcome.success("hello");
 * const sync3 = SyncOutcome.success(true);
 * const allSync = Outcome.all([sync1, sync2, sync3]);
 * // allSync is SyncOutcome<[number, string, boolean], never>
 *
 * // Mixed sync and async outcomes
 * const async1 = Outcome.fromSupplier(() => Promise.resolve(42));
 * const sync4 = SyncOutcome.success("world");
 * const mixed = Outcome.all([async1, sync4]);
 * // mixed is AsyncOutcome<[number, string], never>
 * ```
 */
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
  fromCallback: AsyncOutcome.fromCallback,
  all,
  success: SyncOutcome.success,
  failure: SyncOutcome.failure,
};

export const success = Outcome.success;
export const failure = Outcome.failure;
