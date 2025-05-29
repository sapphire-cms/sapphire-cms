import { Program, program, failure, Outcome } from 'defectless';
import { FsError, JsonParsingError } from './errors';
import { readTextFile } from './fs-utils';

export function loadJson<T>(file: string): Outcome<T, FsError | JsonParsingError> {
  return program(function* (): Program<T, FsError | JsonParsingError> {
    const raw = yield readTextFile(file);

    try {
      return JSON.parse(raw) as T;
    } catch (parsingError) {
      return failure(new JsonParsingError(`Failed to parse JSON file ${file}`, parsingError));
    }
  });
}
