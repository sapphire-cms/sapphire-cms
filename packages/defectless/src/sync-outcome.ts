import { AbstractOutcome } from './abstract-outcome';
import { InferFailureTypes, InferResultTypes, IOutcome } from './defectless.types';
import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';

export class SyncOutcome<R, E> extends AbstractOutcome<R, E> {
  public static success<T = void, F = never>(): SyncOutcome<T, F>;
  public static success<T, F = never>(value: T): SyncOutcome<T, F>;
  public static success<T, F = never>(value?: T): SyncOutcome<T, F> {
    return new SyncOutcome(OutcomeState.success(value as T));
  }

  public static failure<T = never, F = void>(): SyncOutcome<T, F>;
  public static failure<T = never, F = unknown>(error: F): SyncOutcome<never, F>;
  public static failure<T = never, F = unknown>(error?: F): SyncOutcome<never, F> {
    return new SyncOutcome(OutcomeState.failure(error as F, []));
  }

  public static fromSupplier<T, F>(
    supplier: () => T,
    errorFn?: (err: unknown) => F,
  ): SyncOutcome<T, F> {
    return SyncOutcome.fromFunction(supplier, errorFn)();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static fromFunction<Fn extends (...args: readonly any[]) => any, F>(
    producingFunction: Fn,
    errorFn?: (err: unknown) => F,
  ): (...args: Parameters<Fn>) => SyncOutcome<ReturnType<Fn>, F> {
    return (...args: Parameters<Fn>) => {
      try {
        const value = producingFunction(...args);
        return SyncOutcome.success(value);
      } catch (producingFunctionCause) {
        if (errorFn) {
          try {
            const error = errorFn(producingFunctionCause);
            return SyncOutcome.failure(error);
          } catch (errorFnCause) {
            return SyncOutcome.defect(errorFnCause);
          }
        } else {
          return SyncOutcome.defect(producingFunctionCause);
        }
      }
    };
  }

  constructor(private readonly state: OutcomeState<R, E>) {
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
      return SyncOutcome.defect(cause);
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
      return SyncOutcome.defect(cause);
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
      return SyncOutcome.defect(cause);
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
      return SyncOutcome.defect(cause);
    }
  }

  public recover<O extends IOutcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): IOutcome<R, InferFailureTypes<O>>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => Outcome<R, F>,
  ): Outcome<R, E | F>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => SyncOutcome<R, F>,
  ): SyncOutcome<R, E | F>;
  public recover<F>(recoverer: (mainError: E, suppressedErrors: E[]) => R): SyncOutcome<R, E | F>;
  public recover<F>(
    recoverer: (mainError: E, suppressedErrors: E[]) => IOutcome<R, F> | R,
  ): IOutcome<R, E | F> {
    if (this.state.isDefect()) {
      return this as unknown as IOutcome<R, E | F>;
    }

    if (this.state.isSuccess()) {
      return this as unknown as IOutcome<R, E | F>;
    }

    try {
      const newValue = recoverer(this.state.error!, this.state.suppressed);

      if (newValue instanceof Outcome || newValue instanceof SyncOutcome) {
        return newValue as unknown as IOutcome<R, E | F>;
      } else {
        return SyncOutcome.success(newValue as R);
      }
    } catch (cause) {
      return SyncOutcome.defect<R, E | F>(cause);
    }
  }

  public flatMap<O extends IOutcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): IOutcome<InferResultTypes<O>, InferFailureTypes<O>>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): Outcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => SyncOutcome<T, F>): SyncOutcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): IOutcome<T, E | F>;
  public flatMap<T, F>(operation: (value: R) => IOutcome<T, F>): IOutcome<T, E | F> {
    if (this.state.isDefect()) {
      return this as unknown as IOutcome<T, E | F>;
    }

    if (this.state.isFailure()) {
      return this as unknown as IOutcome<T, E | F>;
    }

    try {
      return operation(this.state.value!);
    } catch (cause) {
      return SyncOutcome.defect<T, E | F>(cause);
    }
  }

  public through<O extends IOutcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): IOutcome<R, InferFailureTypes<O>>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): Outcome<R, E | F>;
  public through<F>(operation: (value: R) => SyncOutcome<unknown, F>): SyncOutcome<R, E | F>;
  public through<F>(operation: (value: R) => IOutcome<unknown, F>): IOutcome<R, E | F>;
  public through<F>(operation: (value: R) => IOutcome<unknown, F>): IOutcome<R, E | F> {
    if (this.state.isDefect()) {
      return this;
    }

    if (this.state.isFailure()) {
      return this;
    }

    try {
      return operation(this.state.value!).map((_) => this.state.value) as IOutcome<R, E | F>;
    } catch (cause) {
      return SyncOutcome.defect<R, E | F>(cause);
    }
  }

  public finally<O extends IOutcome<unknown, unknown>>(
    finalization: () => O,
  ): IOutcome<R, InferFailureTypes<O>>;
  public finally<F>(finalization: () => Outcome<unknown, F>): Outcome<R, E | F>;
  public finally<F>(finalization: () => SyncOutcome<unknown, F>): SyncOutcome<R, E | F>;
  public finally<F>(finalization: () => IOutcome<unknown, F>): IOutcome<R, E | F>;
  public finally<F>(finalization: () => IOutcome<unknown, F>): IOutcome<R, E | F> {
    if (this.state.isDefect()) {
      return this as unknown as IOutcome<R, E | F>;
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
        .map((_) => this.state.value!) as IOutcome<R, E | F>;
    } catch (cause) {
      return SyncOutcome.defect<R, E | F>(cause);
    }
  }

  private static defect<T = never, E = never>(cause: unknown): SyncOutcome<T, E> {
    return new SyncOutcome(OutcomeState.defect(cause));
  }
}
