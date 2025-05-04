/* eslint-disable @typescript-eslint/no-explicit-any */
import { errAsync, okAsync, ResultAsync } from 'neverthrow';

export class AsyncProgramDefect extends Error {
  public readonly _tag = 'AsyncProgramDefect';

  constructor(cause: unknown) {
    super('Unexpected error was thrown in asyncProgram', { cause });
  }
}

function nextStep<R, E>(
  generator: Generator<ResultAsync<any, E>>,
  nextValue?: any,
): ResultAsync<R, E | AsyncProgramDefect> {
  let step: IteratorResult<ResultAsync<any, E>>;

  try {
    step = generator.next(nextValue);
  } catch (defect) {
    return errAsync(new AsyncProgramDefect(defect));
  }

  return step.done
    ? okAsync(step.value as R)
    : step.value.andThen<ResultAsync<R, E | AsyncProgramDefect>>(
        (val) => nextStep(generator, val) as ResultAsync<R, E | AsyncProgramDefect>,
      );
}

export function asyncProgram<R, E>(
  program: () => Generator<ResultAsync<any, E>, ResultAsync<R, E> | R>,
  defectHandler: (defect: AsyncProgramDefect) => ResultAsync<R, E>,
): ResultAsync<R, E> {
  const generator = program();
  return nextStep<R, E | AsyncProgramDefect>(generator).orElse((err) => {
    return err instanceof AsyncProgramDefect ? defectHandler(err) : errAsync(err);
  });
}
