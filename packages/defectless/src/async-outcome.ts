import { AbstractOutcome } from './abstract-outcome';
import {
  CombinedPromises,
  ExtractFailureTypesOptional,
  ExtractResultTypes,
  InferFailureTypes,
  InferResultTypes,
} from './defectless.types';
import { Outcome } from './outcome';
import { OutcomeState } from './outcome-state';
import { SyncOutcome } from './sync-outcome';

export class AsyncOutcome<R, E> extends AbstractOutcome<R, E> {
  public static __INTERNAL__ = {
    ...AbstractOutcome.__INTERNAL__,
    create: <T, F>(promise: Promise<OutcomeState<T, F>>): AsyncOutcome<T, F> => {
      return new AsyncOutcome(promise);
    },
  };

  public static all<O extends readonly [Outcome<unknown, unknown>, ...Outcome<unknown, unknown>[]]>(
    asyncOutcomeList: O,
  ): AsyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
  public static all<O extends readonly Outcome<unknown, unknown>[]>(
    asyncOutcomeList: O,
  ): AsyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>>;
  public static all<O extends readonly Outcome<unknown, unknown>[]>(
    asyncOutcomeList: O,
  ): AsyncOutcome<ExtractResultTypes<O>, ExtractFailureTypesOptional<O>> {
    const promises = asyncOutcomeList.map((outcome) =>
      AbstractOutcome.__INTERNAL__.toPromise(outcome as AbstractOutcome<unknown, unknown>),
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

  public recover<O extends Outcome<R, unknown>>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | O,
  ): AsyncOutcome<R, InferFailureTypes<O>>;
  public recover<F = never>(
    recoverer: (mainError: E, suppressedErrors: E[]) => R | Outcome<R, F>,
  ): AsyncOutcome<R, F>;
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
            ? AbstractOutcome.toPromise<R, F>(newValue)
            : OutcomeState.success(newValue as R);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public flatMap<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): AsyncOutcome<InferResultTypes<O>, InferFailureTypes<O>>;
  public flatMap<T, F>(operation: (value: R) => Outcome<T, F>): AsyncOutcome<T, E | F>;
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
          return AbstractOutcome.toPromise<T, F>(newValue as AbstractOutcome<T, F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public through<O extends Outcome<unknown, unknown>>(
    operation: (value: R) => O,
  ): AsyncOutcome<R, InferFailureTypes<O>>;
  public through<F>(operation: (value: R) => Outcome<unknown, F>): AsyncOutcome<R, E | F>;
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
          return AbstractOutcome.toPromise(result as AbstractOutcome<R, E | F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

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
                return SyncOutcome.failure(finalizationError);
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
            .map(() => state.value!);

          return AbstractOutcome.toPromise(result as AbstractOutcome<R, E | F>);
        } catch (cause) {
          return OutcomeState.defect(cause);
        }
      }),
    );
  }

  public sync(): Promise<SyncOutcome<R, E>> {
    return this.promise.then((state) => SyncOutcome.__INTERNAL__.create(state));
  }
}
