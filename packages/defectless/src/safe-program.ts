import { Result, err, Ok, Err, ok } from './result';

export class SafeProgramDefect extends Error {
  public readonly _tag = 'SafeProgramDefect';

  constructor(cause: unknown) {
    super('Unexpected error was thrown in safeProgram', { cause });
  }
}

export type SafeProgram<R, E> = Generator<Result<unknown, E>, Result<R, E> | R>;

function interrupt<R, E>(generator: SafeProgram<R, E>) {
  if (generator.return) {
    try {
      generator.return(null as R);
    } catch (_) {
      // swallow
    }
  }
}

function nextStep<R, E>(
  generator: SafeProgram<R, E>,
  nextValue?: unknown,
): Result<R, E | SafeProgramDefect> {
  let step: IteratorResult<Result<unknown, E>>;

  try {
    step = generator.next(nextValue);
  } catch (defect) {
    interrupt(generator);
    return err(new SafeProgramDefect(defect));
  }

  if (step.done) {
    return step.value instanceof Ok || step.value instanceof Err ? step.value : ok(step.value);
  }

  return step.value
    .andThen((val) => nextStep(generator, val))
    .mapErr((errVal) => {
      interrupt(generator);
      return errVal;
    });
}

export function safeProgram<R, E, TThis>(
  program: (this: TThis) => SafeProgram<R, E> | (() => SafeProgram<R, E>),
  defectHandler: (defect: SafeProgramDefect) => Result<R, E>,
  thisArg?: TThis,
): Result<R, E> {
  const bound = thisArg
    ? ((program as (this: TThis) => SafeProgram<R, E>).bind(thisArg) as () => SafeProgram<R, E>)
    : (program as () => SafeProgram<R, E>);

  const generator = bound();

  return nextStep(generator).orElse((error) => {
    return error instanceof SafeProgramDefect ? defectHandler(error) : err(error);
  });
}
