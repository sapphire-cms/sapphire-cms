import { AsyncProgram, asyncProgram, failure, Outcome } from 'defectless';
import { FsError, JsonParsingError } from './errors';
import { readTextFile } from './fs-utils';

// TODO: add validation by schema like for yaml
export function loadJson<T>(file: string): Outcome<T, FsError | JsonParsingError> {
  return asyncProgram(
    function* (): AsyncProgram<T, FsError | JsonParsingError> {
      const raw = yield readTextFile(file);

      try {
        return JSON.parse(raw) as T;
      } catch (parsingError) {
        return failure(new JsonParsingError(`Failed to parse JSON file ${file}`, parsingError));
      }
    },
    (defect) => failure(new FsError('Defective loadJson program', defect)),
  );
}
