import { _toPromise, AbstractOutcome } from './abstract-outcome';
import {
  CombinedPromises,
  ExtractFailureTypesOptional,
  ExtractResultTypes,
} from './defectless.types';
import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';
import { _createSync, SyncOutcome } from './sync-outcome';

export const _createAsync = Symbol('_createAsync');

export class AsyncOutcome<R, E> extends AbstractOutcome<R, E> {
  /**
   * Creates an AsyncOutcome from a callback-based operation (Node.js style callbacks).
   *
   * This method bridges callback-based APIs with the Outcome system by wrapping operations that use
   * success and error callbacks. The operation function receives two callback functions: one for
   * success results and one for errors. The returned AsyncOutcome will resolve based on which
   * callback is invoked.
   *
   * **Callback Behavior:**
   * - If `onSuccess` callback is called: The AsyncOutcome resolves to a successful outcome with the provided result
   * - If `onFailure` callback is called: The AsyncOutcome resolves to a failed outcome with the provided error
   * - If the operation throws synchronously: The AsyncOutcome resolves to a defected outcome with the thrown error
   * - If neither callback is called: The AsyncOutcome will remain pending indefinitely
   * - If both callbacks are called: Only the first callback invocation takes effect; subsequent calls are ignored
   *
   * **Important:** This method is designed for operations that follow the "exactly one callback" pattern.
   * It does not handle operations that might call callbacks multiple times or operations that might
   * never call any callback.
   *
   * @template T The type of the success result
   * @template F The type of the failure error
   * @param operation A function that performs the async operation, receiving onSuccess and onFailure callbacks
   * @returns An AsyncOutcome that resolves based on which callback is invoked
   *
   * @example
   * ```typescript
   * // Wrapping Node.js fs.readFile
   * import * as fs from 'fs';
   *
   * const readFileOutcome = AsyncOutcome.fromCallback<string, NodeJS.ErrnoException>((onSuccess, onFailure) => {
   *   fs.readFile('config.json', 'utf8', (err, data) => {
   *     if (err) {
   *       onFailure(err);
   *     } else {
   *       onSuccess(data);
   *     }
   *   });
   * });
   * ```
   */
  public static fromCallback<T, F>(
    operation: (onSuccess: (result: T) => void, onFailure: (error: F) => void) => void,
  ): AsyncOutcome<T, F> {
    const { promise, resolve } = Promise.withResolvers<OutcomeState<T, F>>();

    try {
      operation(
        (result) => {
          resolve(OutcomeState.success(result));
        },
        (error) => {
          resolve(OutcomeState.failure(error, []));
        },
      );
    } catch (cause) {
      resolve(OutcomeState.defect(cause));
    }

    return new AsyncOutcome<T, F>(promise);
  }

  /**
   * Combines multiple SyncOutcomes and AsyncOutcomes into a single AsyncOutcome containing all results or failures.
   *
   * This method follows "fail-fast" behavior: if any outcome is a defect, it returns immediately with that defect.
   * If any outcomes are failures, it collects all failures and returns a failed outcome.
   * Only if all outcomes are successful does it return a successful outcome with all results.
   *
   * Combines both heterogeneous and homogeneous lists. This means that you can have lists that contain outcomes with
   * different types of results and failures.
   *
   * @template O The type of the Outcome array
   * @param outcomeList An array of Outcomes to combine
   * @returns A AsyncOutcome containing either:
   *   - Success: An array of all results if all outcomes succeeded
   *   - Failure: An array of failures (with undefined for successful positions) if any failed
   *   - Defect: The first defect encountered
   *
   * @example
   * ```typescript
   * // All successful outcomes
   * const outcomes = [
   *   SyncOutcome.success("hello"),
   *   Outcome.fromSupplier(() => Promise.resolve(42))
   *   SyncOutcome.success(true)
   * ];
   * const result = AsyncOutcome.all(outcomes);
   * // result is a succeeded AsyncOutcome containing result ["hello", 42, true]
   *
   * // Some failed outcomes
   * const mixedOutcomes = [
   *   SyncOutcome.success("hello"),
   *   SyncOutcome.failure("error1"),
   *   Outcome.fromSupplier(() => Promise.resolve(42))
   *   SyncOutcome.failure("error2")
   * ];
   * const mixedResult = AsyncOutcome.all(mixedOutcomes);
   * // mixedResult is a failed outcome containing failure [undefined, "error1", undefined, "error2"]
   * ```
   */
  public static all<O extends readonly [Outcome<unknown, unknown>, ...Outcome<unknown, unknown>[]]>(
    outcomeList: O,
  ): AsyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
  public static all<O extends readonly Outcome<unknown, unknown>[]>(
    outcomeList: O,
  ): AsyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
  public static all<O extends readonly Outcome<unknown, unknown>[]>(
    outcomeList: O,
  ): AsyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>> {
    const promises = outcomeList.map((outcome) =>
      AbstractOutcome[_toPromise](outcome as AbstractOutcome<unknown, unknown>),
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
          failures[i] = undefined;
        } else if (state.isFailure()) {
          failures[i] = state.error;
          results[i] = undefined;
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

    return new AsyncOutcome(all) as AsyncOutcome<
      ExtractResultTypes<O>,
      ExtractFailureTypesOptional<O>
    >;
  }

  private constructor(promise: Promise<OutcomeState<R, E>>) {
    super(promise);
  }

  /**
   * Transforms the success value of this AsyncOutcome using the provided transformer function.
   *
   * This method applies functional transformation to successful outcomes while preserving
   * failure and defect states. If the outcome is a failure or defect, the transformer is not
   * executed and the original outcome is returned unchanged. If the transformer throws an
   * exception, the outcome becomes a defect.
   *
   * @template T The type of the transformed value
   * @param transformer A function that transforms the success value to a new type
   * @returns {AsyncOutcome<T, E>} A new AsyncOutcome with the transformed value, or the original outcome if it was failed/defected
   *
   * @example
   * ```typescript
   * // Transform successful string to number
   * const stringOutcome = Outcome.fromSupplier(() => Promise.resolve("42"));
   * const numberOutcome = stringOutcome.map(s => parseInt(s));
   * // numberOutcome contains 42
   *
   * // Transform successful object
   * const userOutcome = Outcome.fromSupplier(() => Promise.resolve({ name: "Alice", age: 30 }));
   * const nameOutcome = userOutcome.map(user => user.name.toUpperCase());
   * // nameOutcome contains "ALICE"
   *
   * // Failed outcomes are not transformed
   * const failedOutcome = Outcome.fromSupplier<number, string>(() => Promise.reject("error"), (err) => err);
   * const transformedFailed = failedOutcome.map(s => s.length);
   * // transformedFailed still contains the failure "error"
   *
   * // Throwing transformer creates defect
   * const outcome = Outcome.fromSupplier(() => Promise.resolve("invalid"));
   * const defectOutcome = outcome.map(s => JSON.parse(s)); // Throws SyntaxError
   * // defectOutcome becomes a defect with the SyntaxError
   * ```
   */
  public map<T>(transformer: (value: R) => T): AsyncOutcome<T, E> {
    return new AsyncOutcome(
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

  /**
   * Executes a side-effect function on the success value without transforming the outcome.
   *
   * This method allows you to perform side effects (like logging, debugging, or validation)
   * on successful outcomes while preserving the original value and type. If the outcome is
   * a failure or defect, the consumer function is not executed and the original outcome is
   * returned unchanged. If the consumer throws an exception, the outcome becomes a defect.
   *
   * @param consumer A function that performs a side effect on the success value
   * @returns {AsyncOutcome<R, E>} The same AsyncOutcome instance if successful, or the original outcome if failed/defected
   *
   * @example
   * ```typescript
   * // Log successful values for debugging
   * const outcome = Outcome.fromSupplier(() => Promise.resolve("hello"))
   *   .tap(value => console.log(`Processing: ${value}`))
   *   .map(s => s.toUpperCase());
   * // Logs "Processing: hello", outcome contains "HELLO"
   *
   * // Failed outcomes are not tapped
   * const failedOutcome = Outcome.fromSupplier<number, string>(() => Promise.reject("error"), (err) => err)
   *   .tap(value => console.log(`This won't be called: ${value}`));
   * // Nothing is logged, failedOutcome still contains the failure "error"
   *
   * // Throwing consumer creates defect
   * const outcome = Outcome.fromSupplier(() => Promise.resolve("test"))
   *   .tap(value => { throw new Error("Validation failed"); });
   * // outcome becomes a defect with the Error
   * ```
   */
  public tap(consumer: (value: R) => void): AsyncOutcome<R, E> {
    return new AsyncOutcome(
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

  /**
   * Transforms the failure error of this AsyncOutcome using the provided transformer function.
   *
   * This method applies functional transformation to failed outcomes while preserving
   * success and defect states. If the outcome is a success or defect, the transformer is not
   * executed and the original outcome is returned unchanged. If the transformer throws an
   * exception, the outcome becomes a defect.
   *
   * @template F The type of the transformed failure error
   * @param errorTransformer A function that transforms the failure error to a new type
   * @returns {AsyncOutcome<R, F>} A new AsyncOutcome with the transformed error, or the original outcome if it was successful/defected
   *
   * @example
   * ```typescript
   * // Transform string error to structured error object
   * const stringFailure = Outcome.fromSupplier<number, string>(() => Promise.reject("User not found"), (err) => err);
   * const structuredFailure = stringFailure.mapFailure(msg => ({
   *   code: "NOT_FOUND",
   *   message: msg,
   *   timestamp: new Date()
   * }));
   * // structuredFailure contains the structured error object
   *
   * // Transform error codes to user-friendly messages
   * const codeFailure = Outcome.fromSupplier<string, number>(() => Promise.reject(404), (err) => err);
   * const messageFailure = codeFailure.mapFailure(code => {
   *   switch (code) {
   *     case 404: return "Resource not found";
   *     case 500: return "Internal server error";
   *     default: return "Unknown error";
   *   }
   * });
   * // messageFailure contains "Resource not found"
   *
   * // Successful outcomes are not transformed
   * const successOutcome = Outcome.fromSupplier<string, number>(() => Promise.resolve("data"));
   * const transformedSuccess = successOutcome.mapFailure(code => `Error: ${code}`);
   * // transformedSuccess still contains the success "data"
   *
   * // Throwing transformer creates defect
   * const failure = Outcome.fromSupplier<number, string>(() => Promise.reject("test"), (err) => err);
   * const defectOutcome = failure.mapFailure(msg => {
   *   throw new Error("Transform failed");
   * });
   * // defectOutcome becomes a defect with the Error
   * ```
   */
  public mapFailure<F>(errorTransformer: (error: E) => F): AsyncOutcome<R, F> {
    return new AsyncOutcome(
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

  /**
   * Executes a side-effect function on the failure error without transforming the outcome.
   *
   * This method allows you to perform side effects (like logging, debugging, or error tracking)
   * on failed outcomes while preserving the original error and type. If the outcome is
   * a success or defect, the consumer function is not executed and the original outcome is
   * returned unchanged. If the consumer throws an exception, the outcome becomes a defect.
   *
   * @param errorConsumer A function that performs a side effect on the failure error
   * @returns {AsyncOutcome<R, E>} The same AsyncOutcome instance if failed, or the original outcome if successful/defected
   *
   * @example
   * ```typescript
   * // Log failure errors for debugging
   * const outcome = Outcome.fromSupplier<any, string>(() => Promise.reject("Network timeout"), (err) => err)
   *   .tapFailure(error => console.error(`Error occurred: ${error}`))
   *   .mapFailure(msg => ({ code: "TIMEOUT", message: msg }));
   * // Logs "Error occurred: Network timeout", outcome contains structured error
   *
   * // Track errors in monitoring system
   * const userOutcome = Outcome.fromSupplier<any, { code: number, message: string }>(() => Promise.reject({ code: 404, message: "User not found" }), (err) => err)
   *   .tapFailure(error => {
   *     analytics.track("user_lookup_failed", {
   *       errorCode: error.code,
   *       message: error.message
   *     });
   *   });
   * // Error is tracked, userOutcome still contains the original failure
   *
   * // Successful outcomes are not tapped
   * const successOutcome = Outcome.fromSupplier<string, string>(() => Promise.resolve("data"))
   *   .tapFailure(error => console.error(`This won't be called: ${error}`));
   * // Nothing is logged, successOutcome still contains the success "data"
   *
   * // Throwing consumer creates defect
   * const failure = Outcome.fromSupplier<number, string>(() => Promise.reject("test error"), (err) => err)
   *   .tapFailure(error => { throw new Error("Logger failed"); });
   * // failure becomes a defect with the Error
   * ```
   */
  public tapFailure(errorConsumer: (error: E) => void): AsyncOutcome<R, E> {
    return new AsyncOutcome(
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

  /**
   * Recovers from a failure by executing a recovery function.
   *
   * This method allows error recovery when the outcome is in a failed state. The recovery function
   * receives both the main error and any suppressed errors, allowing for comprehensive error handling.
   *
   * If the outcome is successful or defected, the recoverer is not executed and the original
   * outcome is returned unchanged. If the recoverer throws an exception, the outcome becomes a defect.
   *
   * @template F The type of potential new failure from the recovery operation
   * @param recoverer A function that attempts to recover from the failure, receiving the main error and suppressed errors
   * @returns {AsyncOutcome<R, F>} The recovery result as AsyncOutcome
   *
   * @example
   * ```typescript
   * // Direct value recovery
   * const failedOutcome = Outcome.fromSupplier<number, string>(() => Promise.reject("parse error"), (err) => err);
   * const recovered = failedOutcome.recover((error, suppressed) => 0);
   * // recovered is AsyncOutcome<number, never> containing 0
   *
   * // Outcome recovery
   * import { success } from "defectless";
   *
   * const networkFailure = Outcome.fromSupplier<string, string>(() => Promise.reject("network timeout"));
   * const recovered = networkFailure.recover((error, suppressed) => success("cached data"));
   * // recovered is AsyncOutcome<string, never> containing "cached data"
   *
   * // Recovery with new failure type
   * const parseError = Outcome.fromSupplier<number, string>(() => Promise.reject("invalid json"));
   * const recoveredWithNewError = parseError.recover((error, suppressed) =>
   *   Outcome.fromSupplier<number, number>(() => Promise.reject(404))
   * );
   * // recoveredWithNewError is AsyncOutcome<number, number> containing failure 404
   *
   * // Successful outcomes are not recovered
   * const success = Outcome.fromSupplier(() => Promise.resolve(42));
   * const notRecovered = success.recover(() => 0);
   * // notRecovered still contains success 42
   *
   * // Throwing recoverer creates defect
   * const failure = Outcome.fromSupplier<number, string>(() => Promise.reject("error"), (err) => err);
   * const defectFromRecover = failure.recover(() => {
   *   throw new Error("Recovery failed");
   * });
   * // defectFromRecover becomes a defect with the Error
   * ```
   */
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | Outcome<R, F>,
  ): AsyncOutcome<R, F> {
    return new AsyncOutcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<R, F>;
        }

        if (state.isSuccess()) {
          return state as unknown as OutcomeState<R, F>;
        }

        try {
          const newValue = recoverer(state.error!, state.suppressed);
          return newValue instanceof AbstractOutcome
            ? AbstractOutcome[_toPromise]<R, F>(newValue)
            : OutcomeState.success(newValue as R);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  /**
   * Transforms the success value of this AsyncOutcome by applying a function that returns another AsyncOutcome.
   *
   * This method performs monadic bind/flatMap operation, allowing you to chain operations that return
   * Outcomes without nesting. The operation function receives the success value and returns a new AsyncOutcome.
   *
   * If the outcome is failed or defected, the operation is not executed and the original outcome is returned
   * unchanged. Failure types are combined (E | F) to preserve both original and new failure types. If the
   * operation throws an exception, the outcome becomes a defect.
   *
   * @template T The type of the new success value
   * @template F The type of potential new failure from the operation
   * @param operation A function that transforms the success value to a new Outcome
   * @returns {AsyncOutcome<T, E | F>} The result of monadic bind/flatMap operation
   *
   * @example
   * ```typescript
   * // flat map operation
   * const userOutcome = Outcome.fromSupplier(() => Promise.resolve({ id: 1, name: "Alice" }));
   * const mapped = userOutcome.flatMap(user =>
   *   user.id > 0
   *     ? SyncOutcome.success(user.name.toUpperCase())
   *     : SyncOutcome.failure("Invalid user ID")
   * );
   * // mapped is AsyncOutcome<string, string> containing "ALICE"
   *
   * // Chain multiple operations
   * const numberOutcome = Outcome.fromSupplier(() => Promise.resolve("42"));
   * const chained = numberOutcome
   *   .flatMap(str => {
   *     const num = parseInt(str);
   *     return num > 0
   *       ? SyncOutcome.success(num)
   *       : SyncOutcome.failure("Not a positive number");
   *   })
   *   .flatMap(num =>
   *     Outcome.fromSupplier(() => Promise.resolve(num * 2))
   *   );
   * // chained is AsyncOutcome<number, string> containing 84
   *
   * // Failed operations preserve original failure
   * const failedOutcome = Outcome.fromSupplier<number, string>(() => Promise.reject("original error"), (err) => err);
   * const notMapped = failedOutcome.flatMap(str =>
   *   SyncOutcome.success(str.length)
   * );
   * // notMapped still contains the failure "original error"
   *
   * // Throwing operation creates defect
   * const outcome = Outcome.fromSupplier(() => Promise.resolve("test"));
   * const defectOutcome = outcome.flatMap(str => {
   *   throw new Error("Operation failed");
   * });
   * // defectOutcome becomes a defect with the Error
   * ```
   */
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): AsyncOutcome<T, E | F> {
    return new AsyncOutcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<T, E | F>;
        }

        if (state.isFailure()) {
          return state as unknown as OutcomeState<T, E | F>;
        }

        try {
          const newValue = operation(state.value!);
          return AbstractOutcome[_toPromise]<T, F>(newValue as AbstractOutcome<T, F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  /**
   * Executes an operation on the success value while preserving the original value.
   * Similar to `tap` method but need side-effect operation to return an Outcome.
   *
   * This method performs side-effect operations that return Outcomes (like validation, logging, or notification)
   * while preserving the original success value. Unlike `flatMap`, which transforms the value, `through`
   * discards the operation's result value but preserves any failures. The operation function receives the
   * success value and returns an Outcome, which is used only for its failure state.
   *
   * If the outcome is failed or defected, the operation is not executed and the original outcome is returned
   * unchanged. Failure types are combined (E | F) to preserve both original and new failure types. If the
   * operation throws an exception, the outcome becomes a defect.
   *
   * @template F The type of potential new failure from the operation
   * @param operation A function that performs a side-effect operation, receiving the success value and returning an Outcome
   * @returns {AsyncOutcome<R, E | F>} The original outcome with preserved value but combined failure types
   *
   * @example
   * ```typescript
   * // Validation through
   * const userOutcome = Outcome.fromSupplier(() => Promise.resolve({ id: 1, name: "Alice" }));
   * const validated = userOutcome.through(user =>
   *   user.name.length > 0
   *     ? SyncOutcome.success() // Result ignored, only success/failure matters
   *     : SyncOutcome.failure("Name is required")
   * );
   * // validated is AsyncOutcome<{id: number, name: string}, string> containing the original user object
   *
   * // Failed operations add to failure types
   * const valueOutcome = Outcome.fromSupplier(() => Promise.resolve("data"));
   * const checkedAndLogged = valueOutcome
   *   .through(data => Outcome.fromSupplier<void, string>(() => Promise.reject("validation failed")))
   *   .through(data => Outcome.fromSupplier<void, number>(() => Promise.reject(404)));
   * // checkedAndLogged is AsyncOutcome<string, string | number> containing the validation failure
   *
   * // Failed outcomes are not processed
   * const failedOutcome = Outcome.fromSupplier<string, string>(() => Promise.reject("original error"));
   * const notProcessed = failedOutcome.through(str =>
   *   SyncOutcome.success() // This won't execute
   * );
   * // notProcessed still contains the failure "original error"
   *
   * // Throwing operation creates defect
   * const outcome = Outcome.fromSupplier(() => Promise.resolve("test"));
   * const defectOutcome = outcome.through(str => {
   *   throw new Error("Operation failed");
   * });
   * // defectOutcome becomes a defect with the Error
   * ```
   */
  public through<F>(operation: (value: R) => Outcome<unknown, F>): AsyncOutcome<R, E | F> {
    return new AsyncOutcome(
      this.promise.then((state) => {
        if (state.isDefect()) {
          return state;
        }

        if (state.isFailure()) {
          return state;
        }

        try {
          const result = operation(state.value!).map(() => state.value!);
          return AbstractOutcome[_toPromise](result as AbstractOutcome<R, E | F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  /**
   * Executes a finalization operation that always runs, preserving the original outcome while tracking all failures.
   *
   * This method implements a try-finally pattern for Outcomes, ensuring the finalization function always executes
   * regardless of the outcome's state (success or failure). The finalization result is used only for its failure
   * state - any finalization failures are added to the suppressed errors list, preserving a complete error history.
   * The original value and primary error are always preserved.
   *
   * If the original outcome is a defect, the finalization is not executed and the defect is returned unchanged.
   * If the finalization throws an exception, the outcome becomes a defect.
   *
   * **Error Aggregation Behavior:**
   * - If original outcome is successful and finalization succeeds: Returns original success
   * - If original outcome is successful and finalization fails: Returns failure with finalization error as primary
   * - If original outcome is failed and finalization succeeds: Returns original failure unchanged
   * - If original outcome is failed and finalization fails: Returns original failure with finalization error(s) added to suppressed list
   *
   * @template F The type of potential failure from the finalization operation
   * @param finalization A function that performs cleanup/finalization, always executed regardless of outcome state
   * @returns {AsyncOutcome<R, E | F>} The original outcome with finalization failures added to suppressed errors
   *
   * @example
   * ```typescript
   * // Successful outcome with successful cleanup
   * const dataOutcome = Outcome.fromSupplier(() => Promise.resolve("processed data"));
   * const withCleanup = dataOutcome.finally(() =>
   *   SyncOutcome.success() // Cleanup succeeds
   * );
   * // withCleanup is AsyncOutcome<string, never> containing "processed data"
   *
   * // Successful outcome with failed cleanup
   * const successOutcome = Outcome.fromSupplier(() => Promise.resolve(42));
   * const cleanupFailed = successOutcome.finally(() =>
   *   SyncOutcome.failure("cleanup failed")
   * );
   * // cleanupFailed is AsyncOutcome<number, string> containing failure "cleanup failed"
   *
   * // Failed outcome with successful cleanup (preserves original failure)
   * const failedOutcome = Outcome.fromSupplier<string, string>(() => Promise.reject("processing failed"));
   * const cleanedUp = failedOutcome.finally(() =>
   *   SyncOutcome.success() // Cleanup succeeds, but original failure preserved
   * );
   * // cleanedUp is AsyncOutcome<string, string> still containing "processing failed"
   *
   * // Failed outcome with failed cleanup (errors are aggregated in suppressed list)
   * const originalFailure = Outcome.fromSupplier<string, string>(() => Promise.reject("parse error"));
   * const bothFailed = originalFailure.finally(() =>
   *   SyncOutcome.failure("connection cleanup failed")
   * );
   * // bothFailed is AsyncOutcome<number, string> with primary error "parse error"
   * // and "connection cleanup failed" added to suppressed errors list
   *
   * // Multiple finalization steps with error accumulation
   * const complexOutcome = Outcome.fromSupplier<User, string>(() => Promise.reject("validation failed"))
   *   .finally(() => SyncOutcome.failure("database cleanup failed"))
   *   .finally(() => SyncOutcome.failure("cache cleanup failed"))
   *   .finally(() => SyncOutcome.success()); // This one succeeds
   * // complexOutcome preserves "validation failed" as primary error,
   * // with ["database cleanup failed", "cache cleanup failed"] in suppressed errors
   *
   * // Defect outcomes skip finalization
   * const defectOutcome = Outcome.fromSupplier(() => Promise.resolve("test"))
   *   .map(() => { throw new Error("unexpected error"); }); // Creates defect
   * const notFinalized = defectOutcome.finally(() =>
   *   SyncOutcome.success() // This won't execute
   * );
   * // notFinalized is still the original defect
   *
   * // Throwing finalization creates defect
   * const outcome = Outcome.fromSupplier(() => Promise.resolve("data"));
   * const defectFromFinally = outcome.finally(() => {
   *   throw new Error("Finalization crashed");
   * });
   * // defectFromFinally becomes a defect with the Error
   * ```
   */
  public finally<F>(finalization: () => Outcome<unknown, F>): AsyncOutcome<R, E | F> {
    return new AsyncOutcome(
      this.promise.then(async (state) => {
        if (state.isDefect()) {
          return state as unknown as OutcomeState<R, E | F>;
        }

        try {
          const result = finalization()
            .recover((finalizationError, finalizationSuppressed) => {
              if (state.isSuccess()) {
                return new AsyncOutcome(
                  Promise.resolve(OutcomeState.failure(finalizationError, [])),
                );
              } else {
                return new AsyncOutcome(
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
            .flatMap(() => this);

          return AbstractOutcome[_toPromise](result as AbstractOutcome<R, E | F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  /**
   * Converts this AsyncOutcome to a SyncOutcome.
   *
   * The resulting SyncOutcome maintains the same success/failure/defect
   * state as the original AsyncOutcome but can be used in synchronous contexts.
   *
   * @returns {Promise<SyncOutcome<R, E>>} A promise that resolves to a SyncOutcome with the same state
   *
   * @example
   * ```typescript
   * // Convert async outcome to sync
   * const asyncOutcome = Outcome.fromSupplier(() => Promise.resolve("hello"));
   * const syncOutcome = await asyncOutcome.sync();
   * // syncOutcome is SyncOutcome<string, never> containing "hello"
   * ```
   */
  public sync(): Promise<SyncOutcome<R, E>> {
    return this.promise.then((state) => SyncOutcome[_createSync](state));
  }

  protected static [_createAsync]<T, F>(promise: Promise<OutcomeState<T, F>>): AsyncOutcome<T, F> {
    return new AsyncOutcome(promise);
  }
}
