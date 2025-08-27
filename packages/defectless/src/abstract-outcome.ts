import { AsyncOutcome } from './async-outcome';
import { InferFailureTypes } from './defectless.types';
import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';

export const _toPromise = Symbol('_toPromise');

export abstract class AbstractOutcome<R, E> implements Outcome<R, E> {
  protected constructor(protected readonly promise: Promise<OutcomeState<R, E>>) {}

  public abstract map<T>(transformer: (value: R) => T): Outcome<T, E>;
  public abstract tap(consumer: (value: R) => void): Outcome<R, E>;
  public abstract mapFailure<F>(errorTransformer: (error: E) => F): Outcome<R, F>;
  public abstract tapFailure(errorConsumer: (error: E) => void): Outcome<R, E>;

  public abstract recover<O extends Outcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): AsyncOutcome<R, InferFailureTypes<O>>;
  public abstract recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => Outcome<R, F> | R,
  ): Outcome<R, E | F>;

  public abstract flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;

  public abstract through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): AsyncOutcome<R, InferFailureTypes<O>>;
  public abstract through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;

  public abstract finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F>;

  /**
   * Pattern matches on the outcome state and executes corresponding handlers.
   *
   * This method unwraps and handles all possible states of an Outcome.
   *
   * **Handler Execution:**
   * - If successful: Calls `success` handler with the result value
   * - If failed: Calls `failure` handler with the main error and array of suppressed errors
   * - If defected and `defect` handler provided: Calls `defect` handler with the cause
   * - If defected and no `defect` handler provided: Re-throws the defect cause
   *
   * @param success Handler function for successful outcomes, receives the result value
   * @param failure Handler function for failed outcomes, receives main error and suppressed errors array
   * @param defect Optional handler function for defected outcomes, receives the defect cause
   * @returns {Promise<void>} A promise that resolves after the appropriate handler executes
   *
   * @example
   * ```typescript
   * // Basic success/failure matching
   * const outcome = success("hello");
   * await outcome.match(
   *   result => console.log(`Success: ${result}`),
   *   (error, suppressed) => console.error(`Failed: ${error}`)
   * );
   * // Logs "Success: hello"
   *
   * // Handle all three states including defects
   * const riskyOutcome = success("test")
   *   .map(s => JSON.parse(s)); // May throw
   *
   * await riskyOutcome.match(
   *   result => console.log(`Parsed: ${result}`),
   *   (error, suppressed) => console.error(`Parse failed: ${error}`),
   *   defect => console.error(`Unexpected error: ${defect}`)
   * );
   *
   * // Without defect handler (will re-throw defects)
   * const defectiveOutcome = success("invalid")
   *   .map(s => JSON.parse(s)); // Throws SyntaxError
   *
   * try {
   *   await defectiveOutcome.match(
   *     result => console.log(result),
   *     error => console.error(error),
   *     // No defect handler - SyntaxError will be re-thrown
   *   );
   * } catch (defect) {
   *   console.error(`Caught defect: ${defect}`);
   * }
   *
   * // Type-safe value extraction
   * const numberOutcome = success(42);
   * let extractedValue: number | null = null;
   * let extractedError: string | null = null;
   *
   * await numberOutcome.match(
   *   (value) => { extractedValue = value; }, // value is typed as number
   *   (error, suppressed) => { extractedError = error; }, // error is typed as never (no failures possible)
   *   (cause) => { console.error("Unexpected defect"); }
   * );
   * // extractedValue is now 42, extractedError remains null
   * ```
   */
  public match(
    success: (result: R) => void,
    failure: (main: E, suppressed: E[]) => void,
    defect?: (cause: unknown) => void,
  ): Promise<void> {
    return this.promise.then((state) => {
      if (state.isSuccess()) {
        success(state.value!);
      } else if (state.isFailure()) {
        failure(state.error!, state.suppressed);
      } else if (defect) {
        defect(state.defect!);
      } else {
        /* eslint-disable-next-line no-restricted-syntax */
        throw state.defect!;
      }
    });
  }

  protected static [_toPromise]<T, F>(outcome: AbstractOutcome<T, F>): Promise<OutcomeState<T, F>> {
    return outcome.promise;
  }
}
