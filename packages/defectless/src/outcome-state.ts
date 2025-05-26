export class OutcomeState<R, E> {
  public static success<T>(value: T): OutcomeState<T, never> {
    return new OutcomeState(value, undefined, [], undefined) as OutcomeState<T, never>;
  }

  public static failure<F>(error: F, suppressed: F[]): OutcomeState<never, F> {
    return new OutcomeState(undefined, error, suppressed, undefined) as OutcomeState<never, F>;
  }

  public static defect(cause: unknown): OutcomeState<never, never> {
    return new OutcomeState(undefined, undefined, [], cause) as OutcomeState<never, never>;
  }

  private constructor(
    public readonly value: R | undefined = undefined,
    public readonly error: E | undefined = undefined,
    public readonly suppressed: E[] = [],
    public readonly defect: unknown | undefined = undefined,
  ) {}

  public isSuccess(): boolean {
    return !this.isDefect() && !this.isFailure(); // success outcome can have undefined/null result value
  }

  public isFailure(): boolean {
    return !!this.error;
  }

  public isDefect(): boolean {
    return !!this.defect;
  }
}
