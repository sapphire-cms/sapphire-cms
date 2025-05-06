import { ResultAsync } from 'neverthrow';
import { Throwable } from './throwable';

export class CombinedError<PE, FE> extends Throwable {
  public readonly _tag = 'CombinedError';

  constructor(
    public readonly programError: PE,
    public readonly finalizationError: FE,
  ) {
    super('Both program and finalization have failed');
  }
}

export function andFinally<R, PE, FE>(
  program: ResultAsync<R, PE>,
  finalization: () => ResultAsync<void, FE>,
): ResultAsync<R, PE | FE | CombinedError<PE, FE>> {
  return ResultAsync.fromSafePromise(
    new Promise((resolve, reject) => {
      program.match(
        async (result) => {
          await finalization().match(
            () => resolve(result),
            (finalizationError: FE) => reject(finalizationError),
          );
        },
        async (error) => {
          await finalization().match(
            () => reject(error),
            (finalizationError: FE) => reject(new CombinedError(error, finalizationError)),
          );
        },
      );
    }),
  );
}
