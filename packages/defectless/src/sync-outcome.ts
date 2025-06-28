import { AbstractOutcome } from './abstract-outcome';
import { AsyncOutcome } from './async-outcome';
import {
  ExtractFailureTypesOptional,
  ExtractResultTypes,
  InferFailureTypes,
  InferResultTypes,
} from './defectless.types';
import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';

export const _createSync = Symbol('_createSync');
export const _defect = Symbol('_defect');

export class SyncOutcome<R, E> extends AbstractOutcome<R, E> {
  public static success(): SyncOutcome<void, never>;
  public static success<T>(value: T): SyncOutcome<T, never>;
  public static success<T>(value?: T): SyncOutcome<T, never> {
    return new SyncOutcome(OutcomeState.success(value as T));
  }

  public static failure(): SyncOutcome<never, void>;
  public static failure<F = unknown>(error: F): SyncOutcome<never, F>;
  public static failure<F = unknown>(error?: F): SyncOutcome<never, F> {
    return new SyncOutcome(OutcomeState.failure(error as F, []));
  }

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
      } else if (state.isFailure()) {
        failures[i] = state.error;
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

  public recover<O extends Outcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): Outcome<R, InferFailureTypes<O>>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => AsyncOutcome<R, F>,
  ): AsyncOutcome<R, F>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => SyncOutcome<R, F>,
  ): SyncOutcome<R, F>;
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

  public flatMap<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<InferResultTypes<O>, InferFailureTypes<O>>;
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

  public through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): Outcome<R, InferFailureTypes<O>>;
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

  public finally<O extends Outcome<unknown, unknown>>(
    finalization: () => O,
  ): Outcome<R, InferFailureTypes<O>>;
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
