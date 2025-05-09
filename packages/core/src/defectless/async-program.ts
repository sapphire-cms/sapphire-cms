import { failure, success, Outcome } from './outcome';

export class AsyncProgramDefect extends Error {
  public readonly _tag = 'AsyncProgramDefect';

  constructor(cause: unknown) {
    super('Unexpected error was thrown in asyncProgram', { cause });
  }
}

export type AsyncProgram<R, E> = Generator<Outcome<unknown, E>, Outcome<R, E> | R>;

function interrupt<R, E>(generator: AsyncProgram<R, E>) {
  if (generator.return) {
    try {
      generator.return(null as R);
    } catch (_) {
      // swallow
    }
  }
}

function nextStep<R, E>(
  generator: AsyncProgram<R, E>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  nextValue?: any,
): Outcome<R, E | AsyncProgramDefect> {
  let step: IteratorResult<Outcome<unknown, E>>;

  try {
    step = generator.next(nextValue);
  } catch (defect) {
    interrupt(generator);
    return failure(new AsyncProgramDefect(defect));
  }

  if (step.done) {
    return step.value instanceof Outcome ? step.value : success(step.value);
  }

  return step.value
    .andThen((val) => nextStep(generator, val))
    .recover((err) => {
      interrupt(generator);
      return failure(err);
    });
}

export function asyncProgram<R, E, TThis>(
  program: (this: TThis) => AsyncProgram<R, E> | (() => AsyncProgram<R, E>),
  defectHandler: (defect: AsyncProgramDefect) => Outcome<R, E>,
  thisArg?: TThis,
): Outcome<R, E> {
  const bound = thisArg
    ? ((program as (this: TThis) => AsyncProgram<R, E>).bind(thisArg) as () => AsyncProgram<R, E>)
    : (program as () => AsyncProgram<R, E>);

  const generator = bound();

  return nextStep(generator).recover((err) => {
    return err instanceof AsyncProgramDefect ? defectHandler(err) : failure(err);
  });
}
