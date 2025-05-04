import { errAsync, okAsync, ResultAsync } from 'neverthrow';

export class AsyncProgramDefect extends Error {
  public readonly _tag = 'AsyncProgramDefect';

  constructor(cause: unknown) {
    super('Unexpected error was thrown in asyncProgram', { cause });
  }
}

export type AsyncProgram<R, E> = Generator<ResultAsync<unknown, E>, ResultAsync<R, E> | R>;

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
): ResultAsync<R, E | AsyncProgramDefect> {
  let step: IteratorResult<ResultAsync<unknown, E>>;

  try {
    step = generator.next(nextValue);
  } catch (defect) {
    interrupt(generator);
    return errAsync(new AsyncProgramDefect(defect));
  }

  if (step.done) {
    return step.value instanceof ResultAsync ? step.value : okAsync(step.value);
  }

  return step.value
    .andThen((val) => nextStep(generator, val))
    .orElse((err) => {
      interrupt(generator);
      return errAsync(err);
    });
}

export function asyncProgram<R, E>(
  program: () => AsyncProgram<R, E>,
  defectHandler: (defect: AsyncProgramDefect) => ResultAsync<R, E>,
): ResultAsync<R, E> {
  const generator = program();
  return nextStep(generator).orElse((err) => {
    return err instanceof AsyncProgramDefect ? defectHandler(err) : errAsync(err);
  });
}
