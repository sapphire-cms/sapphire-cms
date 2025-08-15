import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { AsyncOutcome, Outcome, program, Program, success, SyncOutcome, SyncProgram } from '../src';
import { expectDefect, expectSuccess } from './test-utils';

describe('program', () => {
  describe('nominal scenario', () => {
    const exampleProgram = (filename: string, fsFailed = false) =>
      program(function* (): Program<number, FsError | JsonParsingError> {
        const fileExist: boolean = yield fileExists(filename, fsFailed);

        if (!fileExist) {
          return 404;
        }

        const content: string = yield loadFileContent(filename);
        const json: object = yield parseJson(content);

        return (json as any).value;
      });

    test('when succeeded', () => {
      const outcome = exampleProgram('success.json');

      expect(outcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

      return expectSuccess(outcome, 42);
    });

    test('when failure yielded', async () => {
      // File exists returns FsError
      const fileExistsFailed = exampleProgram('success.json', true);

      expect(fileExistsFailed).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(fileExistsFailed).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

      return expectError(fileExistsFailed, FsError);

      // JSON parsing fails
      const jsonParsingFailed = exampleProgram('fail.json');

      expect(jsonParsingFailed).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(jsonParsingFailed).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

      return expectError(jsonParsingFailed, JsonParsingError);
    });

    test('when plain value returned', () => {
      const outcome = exampleProgram('unknown.json');

      expect(outcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

      return expectSuccess(outcome, 404);
    });

    test('program that returns outcome', () => {
      const filename = 'success.json';

      const outcome = program(function* (): Program<object, FsError | JsonParsingError> {
        const content: string = yield loadFileContent(filename);
        return parseJson(content);
      });

      expect(outcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome).toEqualTypeOf<Outcome<object, FsError | JsonParsingError>>();

      return expectSuccess(outcome, { value: 42 });
    });
  });

  describe('program throws error', () => {
    test('should return defected outcome', () => {
      const outcome = program(function* (): Program<number, FsError | JsonParsingError> {
        const fileExist: boolean = yield fileExists('success.json');
        throw 'bug!';
        return fileExist ? 200 : 404;
      });

      expect(outcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

      return expectDefect(outcome, 'bug!');
    });
  });

  test('program with "this" argument', () => {
    const instance = {
      fileExists: vi.fn((_filename) => {
        return success(true);
      }) as (filename: string) => Outcome<boolean, FsError>,
    };

    const outcome = program(
      function* (): Program<number, FsError | JsonParsingError> {
        const fileExist: boolean = yield this.fileExists('success.json');
        return fileExist ? 200 : 404;
      },
      instance, // instance is bound as this inside programs body
    );

    expect(outcome).toBeInstanceOf(SyncOutcome);
    expectTypeOf(outcome).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

    return expectSuccess(outcome, 200);
  });

  test('overloaded methods signatures', async () => {
    // Sync program
    const syncProgram = program(function* (): SyncProgram<number, FsError | JsonParsingError> {
      const five: number = yield success(5);
      const seven: number = yield success(7);
      return five + seven;
    });

    expect(syncProgram).toBeInstanceOf(SyncOutcome);
    expectTypeOf(syncProgram).toEqualTypeOf<SyncOutcome<number, FsError | JsonParsingError>>();

    await expectSuccess(syncProgram, 12);

    // General mixed program
    const generalProgram = program(function* (): Program<number, FsError | JsonParsingError> {
      const five: number = yield success(5);
      const seven: number = yield success(7);
      return five + seven;
    });

    expect(generalProgram).toBeInstanceOf(SyncOutcome);
    expectTypeOf(generalProgram).toEqualTypeOf<Outcome<number, FsError | JsonParsingError>>();

    await expectSuccess(generalProgram, 12);
  });
});

function fileExists(filename: string, fail = false): Outcome<boolean, FsError> {
  return AsyncOutcome.fromCallback((onSuccess, onFailure) => {
    if (fail) {
      onFailure(new FsError());
    }

    onSuccess(filename === 'success.json' || filename === 'fail.json');
  });
}

function loadFileContent(filename: string): Outcome<string, FsError> {
  return AsyncOutcome.fromCallback((onSuccess, onFailure) => {
    if (filename === 'success.json') {
      return onSuccess(JSON.stringify({ value: 42 }));
    } else if (filename === 'fail.json') {
      return onSuccess('{"val');
    } else {
      return onFailure(new FsError());
    }
  });
}

function parseJson(content: string): Outcome<object, JsonParsingError> {
  return Outcome.fromSupplier(
    () => JSON.parse(content),
    () => new JsonParsingError(),
  );
}

class ProgramError {}
class FsError extends ProgramError {}
class JsonParsingError extends ProgramError {}

function expectError<E extends ProgramError>(
  outcome: Outcome<unknown, E>,
  expectedError: new (...args: any[]) => E,
): Promise<void> {
  return outcome.match(
    (result) => {
      const msg = 'Unexpected success:\n' + JSON.stringify(result);
      throw new Error(msg);
    },
    (err) => {
      expect(err).toBeInstanceOf(expectedError);
    },
    (defect) => {
      const msg = 'Unexpected defect:\n' + JSON.stringify(defect);
      throw new Error(msg);
    },
  );
}
