import { failure, success, Outcome } from './outcome';

export type Program<R, E> = Generator<Outcome<unknown, E>, Outcome<R, E> | R>;

function interrupt<R, E>(generator: Program<R, E>) {
  if (generator.return) {
    try {
      generator.return(null as R);
    } catch (_) {
      // swallow
    }
  }
}

function nextStep<R, E>(
  generator: Program<R, E>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  nextValue?: any,
): Outcome<R, E> {
  let step: IteratorResult<Outcome<unknown, E>>;

  try {
    step = generator.next(nextValue);
  } catch (defect) {
    interrupt(generator);
    // Create defective Outcome instance
    return Outcome.fromSupplier(() => {
      // eslint-disable-next-line no-restricted-syntax
      throw defect;
    });
  }

  if (step.done) {
    return step.value instanceof Outcome ? step.value : success(step.value);
  }

  return step.value
    .flatMap((val) => nextStep(generator, val))
    .recover((err) => {
      interrupt(generator);
      return failure(err);
    });
}

export function program<R, E, TThis>(
  program: (this: TThis) => Program<R, E> | (() => Program<R, E>),
  thisArg?: TThis,
): Outcome<R, E> {
  const bound = thisArg
    ? ((program as (this: TThis) => Program<R, E>).bind(thisArg) as () => Program<R, E>)
    : (program as () => Program<R, E>);

  const generator = bound();

  return nextStep(generator);
}
