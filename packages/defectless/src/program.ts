import { AbstractOutcome } from './abstract-outcome';
import { failure, Outcome, success } from './outcome';
import { SyncOutcome } from './sync-outcome';

export type Program<R, E> = Generator<Outcome<unknown, E>, Outcome<R, E> | R>;
export type SyncProgram<R, E> = Generator<SyncOutcome<unknown, E>, SyncOutcome<R, E> | R>;

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
    return SyncOutcome.__INTERNAL__.defect(defect) as Outcome<R, E>;
  }

  if (step.done) {
    return step.value instanceof AbstractOutcome ? step.value : success(step.value);
  }

  return step.value
    .flatMap((val) => nextStep(generator, val))
    .recover((err) => {
      interrupt(generator);
      return failure(err);
    });
}

// Narrow: sync-only program (SyncOutcome steps and return)
export function program<R, E, TThis>(
  program: (this: TThis) => SyncProgram<R, E> | (() => SyncProgram<R, E>),
  thisArg?: TThis,
): SyncOutcome<R, E>;

// General: mixed/async Outcome version
export function program<R, E, TThis>(
  program: (this: TThis) => Program<R, E> | (() => Program<R, E>),
  thisArg?: TThis,
): Outcome<R, E>;

// Implementation
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
