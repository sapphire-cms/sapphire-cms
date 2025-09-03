import { AbstractOutcome } from './abstract-outcome';
import { failure, Outcome, success } from './outcome';
import { _defect, SyncOutcome } from './sync-outcome';

/**
 * Generic defectless program, that can yield and return both `AsyncOutcome`s and `SyncOutcome`s.
 */
export type Program<R, E> = Generator<Outcome<unknown, E>, Outcome<R, E> | R>;

/**
 * Synchronous defectless program that can yield and return only `SyncOutcome`s.
 */
export type SyncProgram<R, E> = Generator<SyncOutcome<unknown, E>, SyncOutcome<R, E> | R>;

function interrupt<R, E>(generator: Program<R, E>) {
  if (generator.return) {
    generator.return(null as R);
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
    return SyncOutcome[_defect](defect) as Outcome<R, E>;
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

/**
 * Creates an Outcome-based program that allows writing pseudo-linear code using generator functions.
 * This function is the equivalent of the async/await construct for Outcome objects, enabling you
 * to write sequential-looking code that handles success and error cases elegantly.
 *
 * The program function executes a generator function that yields Outcome objects and automatically
 * handles the chaining of success/failure states, similar to how async/await handles Promise resolution.
 * The program is completed before its end if any failed (or defected) Outcome is yielded.
 * If the generator function throws, the program is completed before its end and returns a defect.
 *
 * @template R - The success result type
 * @template E - The error type
 * @template TThis - The type of the `this` context
 *
 * @param program - A generator function that yields Outcome objects and returns a final result
 * @param thisArg - Optional `this` context to bind to the program function
 * @returns An Outcome containing the final result or any error encountered during execution
 *
 * @example
 * ```typescript
 * // Generic defectless program, that can yield and return both `AsyncOutcome`s and `SyncOutcome`s.
 * function loadDocument(id: number): Outcome<Document, CacheError | DbError> {
 *   return program(
 *     function* (): Program<Document, CacheError | DbError> {
 *       const docIdCache: boolean = yield cacheContains(id);
 *
 *       if (docIdCache) {
 *         return getFromCache(id);
 *       }
 *
 *       const document: Document = yield getFromDb(id);
 *       return putIntoCache(id, document);
 *     }
 *   );
 * }
 *
 * // SyncProgram that can yield and return only `SyncOutcome`s.
 * const addition = program(function* (): SyncProgram<number, unknown> {
 *   const five: number = yield success(5);
 *   const seven: number = yield success(7);
 *   return five + seven;
 * });
 * // addition is a SyncOutcome containing 12
 * ```
 */
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
