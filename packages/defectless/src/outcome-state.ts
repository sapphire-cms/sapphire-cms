enum State {
  SUCCESS,
  FAILURE,
  DEFECT,
}

export class OutcomeState<R, E> {
  public static success<T>(value: T): OutcomeState<T, never> {
    return new OutcomeState(State.SUCCESS, value, undefined, [], undefined) as OutcomeState<
      T,
      never
    >;
  }

  public static failure<F>(error: F, suppressed: F[]): OutcomeState<never, F> {
    return new OutcomeState(State.FAILURE, undefined, error, suppressed, undefined) as OutcomeState<
      never,
      F
    >;
  }

  public static defect(cause: unknown): OutcomeState<never, never> {
    return new OutcomeState(State.DEFECT, undefined, undefined, [], cause) as OutcomeState<
      never,
      never
    >;
  }

  private constructor(
    private readonly state: State,
    public readonly value: R | undefined = undefined,
    public readonly error: E | undefined = undefined,
    public readonly suppressed: E[] = [],
    public readonly defect: unknown | undefined = undefined,
  ) {}

  public isSuccess(): boolean {
    return this.state === State.SUCCESS;
  }

  public isFailure(): boolean {
    return this.state === State.FAILURE;
  }

  public isDefect(): boolean {
    return this.state === State.DEFECT;
  }
}
