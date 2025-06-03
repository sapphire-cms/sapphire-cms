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
