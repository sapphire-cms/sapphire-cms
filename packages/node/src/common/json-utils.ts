import { AsyncProgram, asyncProgram } from '@sapphire-cms/core';
import { errAsync, ResultAsync } from 'neverthrow';
import { FsError, JsonParsingError } from './errors';
import { readTextFile } from './fs-utils';

// TODO: add validation by schema like for yaml
export function loadJson<T>(file: string): ResultAsync<T, FsError | JsonParsingError> {
  return asyncProgram(
    function* (): AsyncProgram<T, FsError | JsonParsingError> {
      const raw = yield readTextFile(file);

      try {
        return JSON.parse(raw) as T;
      } catch (parsingError) {
        return errAsync(new JsonParsingError(`Failed to parse JSON file ${file}`, parsingError));
      }
    },
    (defect) => errAsync(new FsError('Defective loadJson program', defect)),
  );
}
