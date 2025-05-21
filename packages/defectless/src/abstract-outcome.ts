import { IOutcome } from './defectless.types';
import { OutcomeState } from './outcome-state';

export abstract class AbstractOutcome<R, E> implements IOutcome<R, E> {
  protected static toPromise<T, F>(outcome: AbstractOutcome<T, F>): Promise<OutcomeState<T, F>> {
    return outcome.promise;
  }

  // TODO: make promise protected
  protected constructor(public readonly promise: Promise<OutcomeState<R, E>>) {}

  public abstract map<T>(transformer: (value: R) => T): IOutcome<T, E>;
  public abstract tap(consumer: (value: R) => void): IOutcome<R, E>;
  public abstract mapFailure<F>(errorTransformer: (error: E) => F): IOutcome<R, F>;
  public abstract tapFailure(errorConsumer: (error: E) => void): IOutcome<R, E>;
  public abstract recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => IOutcome<R, F> | R,
  ): IOutcome<R, E | F>;
  public abstract flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): IOutcome<T, E | F>;
  public abstract through<F>(operation: (value: R) => IOutcome<unknown, F>): IOutcome<R, E | F>;
  public abstract finally<F>(finalization: () => IOutcome<unknown, F>): IOutcome<R, E | F>;

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
}
