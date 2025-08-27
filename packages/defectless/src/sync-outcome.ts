import { AbstractOutcome } from './abstract-outcome';
import { AsyncOutcome } from './async-outcome';
import { ExtractFailureTypesOptional, ExtractResultTypes } from './defectless.types';
import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';

export const _createSync = Symbol('_createSync');
export const _defect = Symbol('_defect');

export class SyncOutcome<R, E> extends AbstractOutcome<R, E> {
  /**
   * Creates a successful SyncOutcome with the specified value.
   *
   * **Important:** This method should always be used with literal values and should NOT wrap
   * the return of method calls. If an outcome should be constructed from the result of code
   * execution, use `Outcome.fromSupplier()` or `Outcome.fromFunction()` instead.
   *
   * @template T The type of the success value
   * @param value The value to wrap in a successful outcome. If omitted, creates a SyncOutcome<void, never>
   * @returns A SyncOutcome in success state containing the provided value
   *
   * @example
   * ```typescript
   * // DO: Create successful outcomes with literal values
   * const voidOutcome = SyncOutcome.success();
   * const stringOutcome = SyncOutcome.success("hello");
   * const numberOutcome = SyncOutcome.success(42);
   * const objectOutcome = SyncOutcome.success({ id: 1, name: "test" });
   *
   * // DO NOT: Wrap method calls or expressions that might throw
   * const badOutcome = SyncOutcome.success(riskyFunction()); // ❌ Wrong!
   * const anotherBad = SyncOutcome.success(JSON.parse(jsonString)); // ❌ Wrong!
   *
   * // DO: Use appropriate factory methods for code execution
   * const goodOutcome = Outcome.fromSupplier(() => riskyFunction()); // ✅ Correct!
   * const anotherGood = Outcome.fromFunction((s) => JSON.parse(s))(jsonString); // ✅ Correct!
   * ```
   */
  public static success(): SyncOutcome<void, never>;
  public static success<T>(value: T): SyncOutcome<T, never>;
  public static success<T>(value?: T): SyncOutcome<T, never> {
    return new SyncOutcome(OutcomeState.success(value as T));
  }

  /**
   * Creates a failed SyncOutcome with the specified error.
   *
   * **Important:** This method should always be used with literal error values and should NOT wrap
   * the return of method calls.
   *
   * @template F The type of the failure error
   * @param error The error to wrap in a failed outcome. If omitted, creates a SyncOutcome<never, void>
   * @returns A SyncOutcome in failure state containing the provided error
   *
   * @example
   * ```typescript
   * const voidFailure = SyncOutcome.failure();
   * const stringFailure = SyncOutcome.failure("Something went wrong");
   * const numberFailure = SyncOutcome.failure(404);
   * const errorFailure = SyncOutcome.failure(new Error("Invalid input"));
   * const objectFailure = SyncOutcome.failure({ code: "INVALID", message: "Bad request" });
   * ```
   */
  public static failure(): SyncOutcome<never, void>;
  public static failure<F = unknown>(error: F): SyncOutcome<never, F>;
  public static failure<F = unknown>(error?: F): SyncOutcome<never, F> {
    return new SyncOutcome(OutcomeState.failure(error as F, []));
  }

  /**
   * Combines multiple SyncOutcomes into a single SyncOutcome containing all results or failures.
   *
   * This method follows "fail-fast" behavior: if any outcome is a defect, it returns immediately with that defect.
   * If any outcomes are failures, it collects all failures and returns a failed outcome.
   * Only if all outcomes are successful does it return a successful outcome with all results.
   *
   * Combines both heterogeneous and homogeneous lists. This means that you can have lists that contain outcomes with
   * different types of results and failures.
   *
   * @template O The type of the SyncOutcome array
   * @param syncOutcomeList An array of SyncOutcomes to combine
   * @returns A SyncOutcome containing either:
   *   - Success: An array of all results if all outcomes succeeded
   *   - Failure: An array of failures (with undefined for successful positions) if any failed
   *   - Defect: The first defect encountered
   *
   * @example
   * ```typescript
   * // All successful outcomes
   * const outcomes = [
   *   SyncOutcome.success("hello"),
   *   SyncOutcome.success(42),
   *   SyncOutcome.success(true)
   * ];
   * const result = SyncOutcome.all(outcomes);
   * // result is a succeeded SyncOutcome containing result ["hello", 42, true]
   *
   * // Some failed outcomes
   * const mixedOutcomes = [
   *   SyncOutcome.success("hello"),
   *   SyncOutcome.failure("error1"),
   *   SyncOutcome.success(42),
   *   SyncOutcome.failure("error2")
   * ];
   * const mixedResult = SyncOutcome.all(mixedOutcomes);
   * // mixedResult is a failed outcome containing failure [undefined, "error1", undefined, "error2"]
   * ```
   */
  public static all<
    O extends readonly [SyncOutcome<unknown, unknown>, ...SyncOutcome<unknown, unknown>[]],
  >(syncOutcomeList: O): SyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
  public static all<O extends readonly SyncOutcome<unknown, unknown>[]>(
    syncOutcomeList: O,
  ): SyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
  public static all<O extends readonly SyncOutcome<unknown, unknown>[]>(
    syncOutcomeList: O,
  ): SyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>> {
    const states = syncOutcomeList.map((outcome) => outcome.state);

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
      return SyncOutcome[_defect](defect);
    } else if (isFailed) {
      return new SyncOutcome(OutcomeState.failure(failures, suppressed)) as SyncOutcome<
        ExtractResultTypes<O>,
        ExtractFailureTypesOptional<O>
      >;
    } else {
      return SyncOutcome.success(results) as SyncOutcome<
        ExtractResultTypes<O>,
        ExtractFailureTypesOptional<O>
      >;
    }
  }

  private constructor(private readonly state: OutcomeState<R, E>) {
    super(Promise.resolve(state));
  }

  /**
   * Transforms the success value of this SyncOutcome using the provided transformer function.
   *
   * This method applies functional transformation to successful outcomes while preserving
   * failure and defect states. If the outcome is a failure or defect, the transformer is not
   * executed and the original outcome is returned unchanged. If the transformer throws an
   * exception, the outcome becomes a defect.
   *
   * @template T The type of the transformed value
   * @param transformer A function that transforms the success value to a new type
   * @returns A new SyncOutcome with the transformed value, or the original outcome if it was failed/defected
   *
   * @example
   * ```typescript
   * // Transform successful string to number
   * const stringOutcome = SyncOutcome.success("42");
   * const numberOutcome = stringOutcome.map(s => parseInt(s));
   * // numberOutcome contains 42
   *
   * // Transform successful object
   * const userOutcome = SyncOutcome.success({ name: "Alice", age: 30 });
   * const nameOutcome = userOutcome.map(user => user.name.toUpperCase());
   * // nameOutcome contains "ALICE"
   *
   * // Failed outcomes are not transformed
   * const failedOutcome = SyncOutcome.failure<string, string>("error");
   * const transformedFailed = failedOutcome.map(s => s.length);
   * // transformedFailed still contains the failure "error"
   *
   * // Throwing transformer creates defect
   * const outcome = SyncOutcome.success("invalid");
   * const defectOutcome = outcome.map(s => JSON.parse(s)); // Throws SyntaxError
   * // defectOutcome becomes a defect with the SyntaxError
   * ```
   */
  public map<T>(transformer: (value: R) => T): SyncOutcome<T, E> {
    if (this.state.isDefect()) {
      return this as unknown as SyncOutcome<T, E>;
    }

    if (this.state.isFailure()) {
      return this as unknown as SyncOutcome<T, E>;
    }

    try {
      const newValue = transformer(this.state.value!);
      return SyncOutcome.success(newValue);
    } catch (cause) {
      return SyncOutcome[_defect](cause);
    }
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
   * @returns The same SyncOutcome instance if successful, or the original outcome if failed/defected
   *
   * @example
   * ```typescript
   * // Log successful values for debugging
   * const outcome = SyncOutcome.success("hello")
   *   .tap(value => console.log(`Processing: ${value}`))
   *   .map(s => s.toUpperCase());
   * // Logs "Processing: hello", outcome contains "HELLO"
   *
   * // Failed outcomes are not tapped
   * const failedOutcome = SyncOutcome.failure<string, string>("error")
   *   .tap(value => console.log(`This won't be called: ${value}`));
   * // Nothing is logged, failedOutcome still contains the failure "error"
   *
   * // Throwing consumer creates defect
   * const outcome = SyncOutcome.success("test")
   *   .tap(value => { throw new Error("Validation failed"); });
   * // outcome becomes a defect with the Error
   * ```
   */
  public tap(consumer: (value: R) => void): SyncOutcome<R, E> {
    if (this.state.isDefect()) {
      return this;
    }

    if (this.state.isFailure()) {
      return this;
    }

    try {
      consumer(this.state.value!);
      return this;
    } catch (cause) {
      return SyncOutcome[_defect](cause);
    }
  }

  /**
   * Transforms the failure error of this SyncOutcome using the provided transformer function.
   *
   * This method applies functional transformation to failed outcomes while preserving
   * success and defect states. If the outcome is a success or defect, the transformer is not
   * executed and the original outcome is returned unchanged. If the transformer throws an
   * exception, the outcome becomes a defect.
   *
   * @template F The type of the transformed failure error
   * @param errorTransformer A function that transforms the failure error to a new type
   * @returns A new SyncOutcome with the transformed error, or the original outcome if it was successful/defected
   *
   * @example
   * ```typescript
   * // Transform string error to structured error object
   * const stringFailure = SyncOutcome.failure("User not found");
   * const structuredFailure = stringFailure.mapFailure(msg => ({
   *   code: "NOT_FOUND",
   *   message: msg,
   *   timestamp: new Date()
   * }));
   * // structuredFailure contains the structured error object
   *
   * // Transform error codes to user-friendly messages
   * const codeFailure = SyncOutcome.failure(404);
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
   * const successOutcome = SyncOutcome.success<string, number>("data");
   * const transformedSuccess = successOutcome.mapFailure(code => `Error: ${code}`);
   * // transformedSuccess still contains the success "data"
   *
   * // Throwing transformer creates defect
   * const failure = SyncOutcome.failure("test");
   * const defectOutcome = failure.mapFailure(msg => {
   *   throw new Error("Transform failed");
   * });
   * // defectOutcome becomes a defect with the Error
   * ```
   */
  public mapFailure<F>(errorTransformer: (error: E) => F): SyncOutcome<R, F> {
    if (this.state.isDefect()) {
      return this as unknown as SyncOutcome<R, F>;
    }

    if (this.state.isSuccess()) {
      return this as unknown as SyncOutcome<R, F>;
    }

    try {
      const newError = errorTransformer(this.state.error!);
      return new SyncOutcome(
        OutcomeState.failure(newError, this.state.suppressed as unknown as F[]),
      );
    } catch (cause) {
      return SyncOutcome[_defect](cause);
    }
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
   * @returns The same SyncOutcome instance if failed, or the original outcome if successful/defected
   *
   * @example
   * ```typescript
   * // Log failure errors for debugging
   * const outcome = SyncOutcome.failure("Network timeout")
   *   .tapFailure(error => console.error(`Error occurred: ${error}`))
   *   .mapFailure(msg => ({ code: "TIMEOUT", message: msg }));
   * // Logs "Error occurred: Network timeout", outcome contains structured error
   *
   * // Track errors in monitoring system
   * const userOutcome = SyncOutcome.failure({ code: 404, message: "User not found" })
   *   .tapFailure(error => {
   *     analytics.track("user_lookup_failed", {
   *       errorCode: error.code,
   *       message: error.message
   *     });
   *   });
   * // Error is tracked, userOutcome still contains the original failure
   *
   * // Successful outcomes are not tapped
   * const successOutcome = SyncOutcome.success<string, string>("data")
   *   .tapFailure(error => console.error(`This won't be called: ${error}`));
   * // Nothing is logged, successOutcome still contains the success "data"
   *
   * // Throwing consumer creates defect
   * const failure = SyncOutcome.failure("test error")
   *   .tapFailure(error => { throw new Error("Logger failed"); });
   * // failure becomes a defect with the Error
   * ```
   */
  public tapFailure(errorConsumer: (error: E) => void): SyncOutcome<R, E> {
    if (this.state.isDefect()) {
      return this;
    }

    if (this.state.isSuccess()) {
      return this;
    }

    try {
      errorConsumer(this.state.error!);
      return this;
    } catch (cause) {
      return SyncOutcome[_defect](cause);
    }
  }

  /**
   * Recovers from a failure by executing a recovery function.
   *
   * This method allows error recovery when the outcome is in a failed state. The recovery function
   * receives both the main error and any suppressed errors, allowing for comprehensive error handling.
   * The return type varies based on what the recoverer function returns.
   *
   * This is one of the methods that can escalate the flow from synchronous to asynchronous, if recovery function
   * returns AsyncOutcome.
   *
   * If the outcome is successful or defected, the recoverer is not executed and the original
   * outcome is returned unchanged. If the recoverer throws an exception, the outcome becomes a defect.
   *
   * @template F The type of potential new failure from the recovery operation
   * @param recoverer A function that attempts to recover from the failure, receiving the main error and suppressed errors
   * @returns The recovery result with type determined by the recoverer's return value:
   *   - AsyncOutcome<R, F> if recoverer returns AsyncOutcome
   *   - SyncOutcome<R, F> if recoverer returns SyncOutcome or a direct value
   *   - Outcome<R, F> if recoverer returns generic Outcome
   *
   * @example
   * ```typescript
   * // Direct value recovery (returns SyncOutcome)
   * const failedOutcome = SyncOutcome.failure<number, string>("parse error");
   * const recovered = failedOutcome.recover((error, suppressed) => 0);
   * // recovered is SyncOutcome<number, never> containing 0
   *
   * // SyncOutcome recovery (returns SyncOutcome)
   * const networkFailure = SyncOutcome.failure<string, string>("network timeout");
   * const syncRecovered = networkFailure.recover((error, suppressed) =>
   *   SyncOutcome.success("cached data")
   * );
   * // syncRecovered is SyncOutcome<string, never> containing "cached data"
   *
   * // AsyncOutcome recovery (escalates to async, returns AsyncOutcome)
   * const apiFailure = SyncOutcome.failure<User, string>("api error");
   * const asyncRecovered = apiFailure.recover((error, suppressed) =>
   *   Outcome.fromSupplier(() => fetchFromCache())
   * );
   * // asyncRecovered is AsyncOutcome<User, CacheError> - flow is now async!
   *
   * // Recovery with new failure type
   * const parseError = SyncOutcome.failure<number, string>("invalid json");
   * const recoveredWithNewError = parseError.recover((error, suppressed) =>
   *   SyncOutcome.failure<number, number>(404)
   * );
   * // recoveredWithNewError is SyncOutcome<number, number> containing failure 404
   *
   * // Successful outcomes are not recovered
   * const success = SyncOutcome.success(42);
   * const notRecovered = success.recover(() => 0);
   * // notRecovered still contains success 42
   *
   * // Throwing recoverer creates defect
   * const failure = SyncOutcome.failure("error");
   * const defectFromRecover = failure.recover(() => {
   *   throw new Error("Recovery failed");
   * });
   * // defectFromRecover becomes a defect with the Error
   * ```
   */
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => AsyncOutcome<R, F>,
  ): AsyncOutcome<R, F>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => SyncOutcome<R, F>,
  ): SyncOutcome<R, F>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => Outcome<R, F>,
  ): Outcome<R, F>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R,
  ): SyncOutcome<R, F>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => Outcome<R, F> | R,
  ): Outcome<R, F> {
    if (this.state.isDefect()) {
      return this as unknown as Outcome<R, F>;
    }

    if (this.state.isSuccess()) {
      return this as unknown as Outcome<R, F>;
    }

    try {
      const newValue = recoverer(this.state.error!, this.state.suppressed);

      if (newValue instanceof AsyncOutcome || newValue instanceof SyncOutcome) {
        return newValue as unknown as Outcome<R, F>;
      } else {
        return SyncOutcome.success(newValue as R);
      }
    } catch (cause) {
      return SyncOutcome[_defect]<R, F>(cause);
    }
  }

  /**
   * Transforms the success value of this SyncOutcome by applying a function that returns another Outcome.
   *
   * This method performs monadic bind/flatMap operation, allowing you to chain operations that return
   * Outcomes without nesting. The operation function receives the success value and returns a new Outcome.
   * The return type varies based on what the operation function returns.
   *
   * This is one of the methods that can escalate the flow from synchronous to asynchronous, if operation function
   * returns AsyncOutcome.
   *
   * If the outcome is failed or defected, the operation is not executed and the original outcome is returned
   * unchanged. Failure types are combined (E | F) to preserve both original and new failure types. If the
   * operation throws an exception, the outcome becomes a defect.
   *
   * @template T The type of the new success value
   * @template F The type of potential new failure from the operation
   * @param operation A function that transforms the success value to a new Outcome
   * @returns The result with type determined by the operation's return value:
   *   - AsyncOutcome<T, E | F> if operation returns AsyncOutcome
   *   - SyncOutcome<T, E | F> if operation returns SyncOutcome
   *   - Outcome<T, E | F> if operation returns generic Outcome
   *
   * @example
   * ```typescript
   * // SyncOutcome operation (remains synchronous)
   * const userOutcome = SyncOutcome.success({ id: 1, name: "Alice" });
   * const syncMapped = userOutcome.flatMap(user =>
   *   user.id > 0
   *     ? SyncOutcome.success(user.name.toUpperCase())
   *     : SyncOutcome.failure("Invalid user ID")
   * );
   * // syncMapped is SyncOutcome<string, string> containing "ALICE"
   *
   * // AsyncOutcome operation (escalates to async, returns AsyncOutcome)
   * const dataOutcome = SyncOutcome.success("user123");
   * const asyncMapped = dataOutcome.flatMap(userId =>
   *   Outcome.fromSupplier(() => fetchUserFromAPI(userId))
   * );
   * // asyncMapped is AsyncOutcome<User, ApiError> - flow is now async!
   *
   * // Chain multiple operations
   * const numberOutcome = SyncOutcome.success("42");
   * const chained = numberOutcome
   *   .flatMap(str => {
   *     const num = parseInt(str);
   *     return num > 0
   *       ? SyncOutcome.success(num)
   *       : SyncOutcome.failure("Not a positive number");
   *   })
   *   .flatMap(num =>
   *     SyncOutcome.success(num * 2)
   *   );
   * // chained is SyncOutcome<number, string> containing 84
   *
   * // Failed operations preserve original failure
   * const failedOutcome = SyncOutcome.failure<string, string>("original error");
   * const notMapped = failedOutcome.flatMap(str =>
   *   SyncOutcome.success(str.length)
   * );
   * // notMapped still contains the failure "original error"
   *
   * // Throwing operation creates defect
   * const outcome = SyncOutcome.success("test");
   * const defectOutcome = outcome.flatMap(str => {
   *   throw new Error("Operation failed");
   * });
   * // defectOutcome becomes a defect with the Error
   * ```
   */
  public flatMap<T, F>(operation: (value: R) => AsyncOutcome<T, F>): AsyncOutcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => SyncOutcome<T, F>): SyncOutcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F> {
    if (this.state.isDefect()) {
      return this as unknown as Outcome<T, E | F>;
    }

    if (this.state.isFailure()) {
      return this as unknown as Outcome<T, E | F>;
    }

    try {
      return operation(this.state.value!);
    } catch (cause) {
      return SyncOutcome[_defect]<T, E | F>(cause);
    }
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
   * This is one of the methods that can escalate the flow from synchronous to asynchronous, if operation function
   * returns AsyncOutcome.
   *
   * If the outcome is failed or defected, the operation is not executed and the original outcome is returned
   * unchanged. Failure types are combined (E | F) to preserve both original and new failure types. If the
   * operation throws an exception, the outcome becomes a defect.
   *
   * @template F The type of potential new failure from the operation
   * @param operation A function that performs a side-effect operation, receiving the success value and returning an Outcome
   * @returns The original outcome with preserved value but combined failure types:
   *   - AsyncOutcome<R, E | F> if operation returns AsyncOutcome
   *   - SyncOutcome<R, E | F> if operation returns SyncOutcome
   *   - Outcome<R, E | F> if operation returns generic Outcome
   *
   * @example
   * ```typescript
   * // Validation through (remains synchronous)
   * const userOutcome = SyncOutcome.success({ id: 1, name: "Alice" });
   * const validated = userOutcome.through(user =>
   *   user.name.length > 0
   *     ? SyncOutcome.success() // Result ignored, only success/failure matters
   *     : SyncOutcome.failure("Name is required")
   * );
   * // validated is SyncOutcome<{id: number, name: string}, string> containing the original user object
   *
   * // Async logging through (escalates to async, returns AsyncOutcome)
   * const dataOutcome = SyncOutcome.success("important data");
   * const logged = dataOutcome.through(data =>
   *   Outcome.fromSupplier(
   *     () => logToRemoteService(data), // logToRemoteService returns a promise
   *     (err) => new LogError(err),
   *   )
   * );
   * // logged is AsyncOutcome<string, LogError> - flow is now async, but original "important data" is preserved
   *
   * // Chain validation operations
   * const numberOutcome = SyncOutcome.success(42);
   * const validated = numberOutcome
   *   .through(num =>
   *     num > 0
   *       ? SyncOutcome.success() // Positive check passes
   *       : SyncOutcome.failure("Must be positive")
   *   )
   *   .through(num =>
   *     num < 100
   *       ? SyncOutcome.success() // Range check passes
   *       : SyncOutcome.failure("Must be less than 100")
   *   );
   * // validated is SyncOutcome<number, string> still containing 42 if all validations pass
   *
   * // Failed operations add to failure types
   * const valueOutcome = SyncOutcome.success("data");
   * const checkedAndLogged = valueOutcome
   *   .through(data => SyncOutcome.failure<void, string>("validation failed"))
   *   .through(data => SyncOutcome.failure<void, number>(404));
   * // checkedAndLogged is SyncOutcome<string, string | number> containing the validation failure
   *
   * // Failed outcomes are not processed
   * const failedOutcome = SyncOutcome.failure<string, string>("original error");
   * const notProcessed = failedOutcome.through(str =>
   *   SyncOutcome.success() // This won't execute
   * );
   * // notProcessed still contains the failure "original error"
   *
   * // Throwing operation creates defect
   * const outcome = SyncOutcome.success("test");
   * const defectOutcome = outcome.through(str => {
   *   throw new Error("Operation failed");
   * });
   * // defectOutcome becomes a defect with the Error
   * ```
   */
  public through<F>(operation: (value: R) => AsyncOutcome<unknown, F>): AsyncOutcome<R, E | F>;
  public through<F>(operation: (value: R) => SyncOutcome<unknown, F>): SyncOutcome<R, E | F>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F> {
    if (this.state.isDefect()) {
      return this;
    }

    if (this.state.isFailure()) {
      return this;
    }

    try {
      return operation(this.state.value!).map(() => this.state.value) as Outcome<R, E | F>;
    } catch (cause) {
      return SyncOutcome[_defect]<R, E | F>(cause);
    }
  }

  /**
   * Executes a finalization operation that always runs, preserving the original outcome while tracking all failures.
   *
   * This method implements a try-finally pattern for Outcomes, ensuring the finalization function always executes
   * regardless of the outcome's state (success or failure). The finalization result is used only for its failure
   * state - any finalization failures are added to the suppressed errors list, preserving a complete error history.
   * The original value and primary error are always preserved.
   *
   * This is one of the methods that can escalate the flow from synchronous to asynchronous, if finalization function
   * returns AsyncOutcome.
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
   * @returns The original outcome with finalization failures added to suppressed errors:
   *   - AsyncOutcome<R, E | F> if finalization returns AsyncOutcome
   *   - SyncOutcome<R, E | F> if finalization returns SyncOutcome
   *   - Outcome<R, E | F> if finalization returns generic Outcome
   *
   * @example
   * ```typescript
   * // Successful outcome with successful cleanup
   * const dataOutcome = SyncOutcome.success("processed data");
   * const withCleanup = dataOutcome.finally(() =>
   *   SyncOutcome.success() // Cleanup succeeds
   * );
   * // withCleanup is SyncOutcome<string, never> containing "processed data"
   *
   * // Successful outcome with failed cleanup
   * const successOutcome = SyncOutcome.success(42);
   * const cleanupFailed = successOutcome.finally(() =>
   *   SyncOutcome.failure("cleanup failed")
   * );
   * // cleanupFailed is SyncOutcome<number, string> containing failure "cleanup failed"
   *
   * // Failed outcome with successful cleanup (preserves original failure)
   * const failedOutcome = SyncOutcome.failure<string, string>("processing failed");
   * const cleanedUp = failedOutcome.finally(() =>
   *   SyncOutcome.success() // Cleanup succeeds, but original failure preserved
   * );
   * // cleanedUp is SyncOutcome<string, string> still containing "processing failed"
   *
   * // Failed outcome with failed cleanup (errors are aggregated in suppressed list)
   * const originalFailure = SyncOutcome.failure<number, string>("parse error");
   * const bothFailed = originalFailure.finally(() =>
   *   SyncOutcome.failure("connection cleanup failed")
   * );
   * // bothFailed is SyncOutcome<number, string> with primary error "parse error"
   * // and "connection cleanup failed" added to suppressed errors list
   *
   * // Multiple finalization steps with error accumulation
   * const complexOutcome = SyncOutcome.failure<User, string>("validation failed")
   *   .finally(() => SyncOutcome.failure("database cleanup failed"))
   *   .finally(() => SyncOutcome.failure("cache cleanup failed"))
   *   .finally(() => SyncOutcome.success()); // This one succeeds
   * // complexOutcome preserves "validation failed" as primary error,
   * // with ["database cleanup failed", "cache cleanup failed"] in suppressed errors
   *
   * // Async finalization (escalates to async, returns AsyncOutcome)
   * const outcome = SyncOutcome.success("data");
   * const asyncFinalized = outcome.finally(() =>
   *   Outcome.fromSupplier(
   *     () => closeConnection(), // closeConnection returns Promise
   *     (err) => new ConnectionError(err),
   *   )
   * );
   * // asyncFinalized is AsyncOutcome<string, ConnectionError> - flow is now async!
   *
   * // Defect outcomes skip finalization
   * const defectOutcome = SyncOutcome.success("test")
   *   .map(() => { throw new Error("unexpected error"); }); // Creates defect
   * const notFinalized = defectOutcome.finally(() =>
   *   SyncOutcome.success() // This won't execute
   * );
   * // notFinalized is still the original defect
   *
   * // Throwing finalization creates defect
   * const outcome = SyncOutcome.success("data");
   * const defectFromFinally = outcome.finally(() => {
   *   throw new Error("Finalization crashed");
   * });
   * // defectFromFinally becomes a defect with the Error
   * ```
   */
  public finally<F>(finalization: () => AsyncOutcome<unknown, F>): AsyncOutcome<R, E | F>;
  public finally<F>(finalization: () => SyncOutcome<unknown, F>): SyncOutcome<R, E | F>;
  public finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F>;
  public finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F> {
    if (this.state.isDefect()) {
      return this as unknown as Outcome<R, E | F>;
    }

    try {
      return finalization()
        .recover((finalizationError, finalizationSuppressed) => {
          if (this.state.isSuccess()) {
            return SyncOutcome.failure(finalizationError);
          } else {
            return new SyncOutcome(
              OutcomeState.failure(this.state.error!, [
                ...this.state.suppressed,
                finalizationError,
                ...finalizationSuppressed,
              ]),
            );
          }
        })
        .flatMap(() => this) as Outcome<R, E | F>;
    } catch (cause) {
      return SyncOutcome[_defect]<R, E | F>(cause);
    }
  }

  /**
   * Performs synchronous pattern matching on the outcome, executing the appropriate handler based on the outcome's state.
   *
   * This method provides a synchronous way to unwrap and handle all possible states of a SyncOutcome.
   * It executes exactly one of the provided handler functions based on whether the outcome is successful,
   * failed, or defected. This is the primary way to extract and act upon the contained value or error
   * in a type-safe manner.
   *
   * **Handler Execution:**
   * - If the outcome is successful: Calls `success` handler with the result value
   * - If the outcome is failed: Calls `failure` handler with the main error and suppressed errors array
   * - If the outcome is defected and `defect` handler is provided: Calls `defect` handler with the cause
   * - If the outcome is defected and no `defect` handler is provided: **Throws the defect cause**
   *
   * **Important:** If no defect handler is provided and the outcome is a defect, this method will throw
   * the defect cause.
   *
   * @param success A function to handle successful outcomes, receiving the success value
   * @param failure A function to handle failed outcomes, receiving the main error and suppressed errors array
   * @param defect An optional function to handle defected outcomes, receiving the defect cause. If omitted and the outcome is defected, the defect cause will be thrown
   * @returns void - this method performs side effects through the handler functions
   *
   * @throws {unknown} The defect cause if the outcome is defected and no defect handler is provided
   *
   * @example
   * ```typescript
   * // Handle successful outcome
   * const successOutcome = SyncOutcome.success("Hello World");
   * successOutcome.matchSync(
   *   (value) => console.log(`Success: ${value}`), // This will execute
   *   (error, suppressed) => console.error(`Failed: ${error}`),
   *   (cause) => console.error(`Defect: ${cause}`)
   * );
   * // Output: "Success: Hello World"
   *
   * // Handle failed outcome with suppressed errors
   * const failedOutcome = SyncOutcome.failure<string, string>("main error")
   *   .finally(() => SyncOutcome.failure("cleanup failed"));
   * failedOutcome.matchSync(
   *   (value) => console.log(`Success: ${value}`),
   *   (mainError, suppressedErrors) => { // This will execute
   *     console.error(`Main error: ${mainError}`);
   *     console.error(`Suppressed: ${suppressedErrors.join(", ")}`);
   *   },
   *   (cause) => console.error(`Defect: ${cause}`)
   * );
   * // Output: "Main error: main error"
   * //         "Suppressed: cleanup failed"
   *
   * // Handle defected outcome with defect handler
   * const defectOutcome = SyncOutcome.success("test")
   *   .map(() => { throw new Error("Something went wrong"); });
   * defectOutcome.matchSync(
   *   (value) => console.log(`Success: ${value}`),
   *   (error, suppressed) => console.error(`Failed: ${error}`),
   *   (cause) => console.error(`Defect occurred: ${cause}`) // This will execute
   * );
   * // Output: "Defect occurred: Error: Something went wrong"
   *
   * // Handle defected outcome without defect handler (throws!)
   * const throwingDefect = SyncOutcome.success(42)
   *   .map(() => { throw new Error("Unexpected error"); });
   * try {
   *   throwingDefect.matchSync(
   *     (value) => console.log(`Success: ${value}`),
   *     (error, suppressed) => console.error(`Failed: ${error}`)
   *     // No defect handler - will throw!
   *   );
   * } catch (cause) {
   *   console.error(`Caught defect: ${cause}`);
   * }
   * // Output: "Caught defect: Error: Unexpected error"
   *
   * // Type-safe value extraction
   * const numberOutcome = SyncOutcome.success(42);
   * let extractedValue: number | null = null;
   * let extractedError: string | null = null;
   *
   * numberOutcome.matchSync(
   *   (value) => { extractedValue = value; }, // value is typed as number
   *   (error, suppressed) => { extractedError = error; }, // error is typed as never (no failures possible)
   *   (cause) => { console.error("Unexpected defect"); }
   * );
   * // extractedValue is now 42, extractedError remains null
   * ```
   */
  public matchSync(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    defect?: (cause: unknown) => void,
  ): void {
    if (this.state.isSuccess()) {
      success(this.state.value!);
    } else if (this.state.isFailure()) {
      failure(this.state.error!, this.state.suppressed);
    } else if (defect) {
      defect(this.state.defect!);
    } else {
      /* eslint-disable-next-line no-restricted-syntax */
      throw this.state.defect!;
    }
  }

  protected static [_createSync]<T, F>(state: OutcomeState<T, F>): SyncOutcome<T, F> {
    return new SyncOutcome(state);
  }

  protected static [_defect]<T = never, E = never>(cause: unknown): SyncOutcome<T, E> {
    return new SyncOutcome(OutcomeState.defect(cause));
  }
}
