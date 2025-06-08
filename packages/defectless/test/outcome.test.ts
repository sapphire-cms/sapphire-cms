import { describe, expect, test, vitest } from 'vitest';
import { err, failure, ok, AsyncOutcome, success, Outcome } from '../src';
import { AbstractOutcome } from '../src/abstract-outcome';

describe('Outcome', () => {
  describe('fromCallback', () => {
    test('should succeed with onSuccess', () => {
      const outcome = Outcome.fromCallback((onSuccess) => {
        onSuccess('ok');
      });

      return outcome.match(
        (result) => {
          expect(result).toBe('ok');
        },
        (err) => {
          throw err;
        },
        (defect) => {
          throw defect;
        },
      );
    });

    test('should fail with onFailure', () => {
      const outcome = Outcome.fromCallback((_onSuccess, onFailure) => {
        onFailure('ko');
      });

      return outcome.match(
        (_) => {
          throw new Error('outcome should be a failure');
        },
        (err) => {
          expect(err).toBe('ko');
        },
        (defect) => {
          throw defect;
        },
      );
    });

    test('should become defect if operation fails', () => {
      const outcome = Outcome.fromCallback((_onSuccess, _onFailure) => {
        throw 'ouups!';
      });

      return outcome.match(
        (_result) => {
          throw new Error('outcome should be a defect');
        },
        (_err) => {
          throw new Error('outcome should be a defect');
        },
        (defect) => {
          expect(defect).toBe('ouups!');
        },
      );
    });
  });

  describe('map', () => {
    test('Maps a value using a synchronous function', () => {
      const asyncVal = success(12);

      const mapSyncFn = vitest.fn((number) => number.toString());

      const mapped = asyncVal.map(mapSyncFn);

      expect(mapped).toBeInstanceOf(AbstractOutcome);

      return mapped.match(
        (result) => {
          expect(result).toBe('12');
          expect(mapSyncFn).toHaveBeenCalledTimes(1);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Skips an error', () => {
      const asyncErr = failure<number, string>('Wrong format');

      const mapSyncFn = vitest.fn((number) => number.toString());

      const notMapped = asyncErr.map(mapSyncFn);

      expect(notMapped).toBeInstanceOf(AbstractOutcome);

      return notMapped.match(
        () => {
          throw new Error('map should fail');
        },
        (err) => {
          expect(err).toBe('Wrong format');
          expect(mapSyncFn).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('mapFailure', () => {
    test('Maps an error using a synchronous function', () => {
      const asyncErr = failure('Wrong format');

      const mapErrSyncFn = vitest.fn((str) => 'Error: ' + str);

      const mappedErr = asyncErr.mapFailure(mapErrSyncFn);

      expect(mappedErr).toBeInstanceOf(AbstractOutcome);

      return mappedErr.match(
        () => {
          throw new Error('mapFailure should return failure');
        },
        (err) => {
          expect(err).toBe('Error: Wrong format');
          expect(mapErrSyncFn).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('Skips a value', () => {
      const asyncVal = success(12);

      const mapErrSyncFn = vitest.fn((str) => 'Error: ' + str);

      const notMapped = asyncVal.mapFailure(mapErrSyncFn);

      expect(notMapped).toBeInstanceOf(AbstractOutcome);

      return notMapped.match(
        (result) => {
          expect(result).toBe(12);
          expect(mapErrSyncFn).toHaveBeenCalledTimes(0);
        },
        (err) => {
          throw err;
        },
      );
    });
  });

  describe('flatMap', () => {
    test('Maps a value using a function returning a ResultAsync', () => {
      const asyncVal = success(12);

      const andThenResultAsyncFn = vitest.fn(() => success('good'));

      const mapped = asyncVal.flatMap(andThenResultAsyncFn);

      expect(mapped).toBeInstanceOf(AbstractOutcome);

      return mapped.match(
        (result) => {
          expect(result).toBe('good');
          expect(andThenResultAsyncFn).toHaveBeenCalledTimes(1);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Skips an Error', () => {
      const asyncVal = failure<string, string>('Wrong format');

      const andThenResultFn = vitest.fn(() => ok<string, string>('good'));

      const notMapped = asyncVal.flatMap(andThenResultFn);

      expect(notMapped).toBeInstanceOf(AbstractOutcome);

      return notMapped.match(
        () => {
          throw new Error('andThen should fail');
        },
        (err) => {
          expect(err).toBe('Wrong format');
          expect(andThenResultFn).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('through', () => {
    test('Returns the original value when map function returning ResultAsync succeeds', () => {
      const asyncVal = success(12);
      /*
        A couple examples of this function

        DB persistence (create or update)
        API calls (create or update)
      */
      const andThroughResultAsyncFn = vitest.fn(() => success('good'));

      const passedThrough = asyncVal.through(andThroughResultAsyncFn);

      expect(passedThrough).toBeInstanceOf(AbstractOutcome);

      return passedThrough.match(
        (result) => {
          expect(result).toBe(12);
          expect(andThroughResultAsyncFn).toHaveBeenCalledTimes(1);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Maps to an error when map function returning ResultAsync fails', () => {
      const asyncVal = success(12);

      const andThroughResultAsyncFn = vitest.fn(() => failure('oh no!'));

      const passedThrough = asyncVal.through(andThroughResultAsyncFn);

      expect(passedThrough).toBeInstanceOf(AbstractOutcome);

      return passedThrough.match(
        (result) => {
          throw new Error('Failure should pass through');
        },
        (err) => {
          expect(err).toBe('oh no!');
          expect(andThroughResultAsyncFn).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('Returns the original value when map function returning Result succeeds', () => {
      const asyncVal = success(12);

      const andThroughResultFn = vitest.fn(() => success('good'));

      const passedThrough = asyncVal.through(andThroughResultFn);

      expect(passedThrough).toBeInstanceOf(AbstractOutcome);

      return passedThrough.match(
        (result) => {
          expect(result).toBe(12);
          expect(andThroughResultFn).toHaveBeenCalledTimes(1);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Maps to an error when map function returning Result fails', () => {
      const asyncVal = success(12);

      const andThroughResultFn = vitest.fn(() => failure('oh no!'));

      const passedThrough = asyncVal.through(andThroughResultFn);

      expect(passedThrough).toBeInstanceOf(AbstractOutcome);

      return passedThrough.match(
        () => {
          throw new Error('through should fail');
        },
        (err) => {
          expect(err).toBe('oh no!');
          expect(andThroughResultFn).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('Skips an Error', () => {
      const asyncVal = failure<string, string>('Wrong format');

      const andThroughResultFn = vitest.fn(() => success<string, string>('good'));

      const notMapped = asyncVal.through(andThroughResultFn);

      expect(notMapped).toBeInstanceOf(AbstractOutcome);

      return notMapped.match(
        () => {
          throw new Error('through should fail');
        },
        (err) => {
          expect(err).toBe('Wrong format');
          expect(andThroughResultFn).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('tap', () => {
    test('Calls the passed function but returns an original ok', () => {
      const okVal = success(12);
      const passedFn = vitest.fn((_number) => {});

      const taped = okVal.tap(passedFn);

      return taped.match(
        (result) => {
          expect(result).toStrictEqual(12);
          expect(passedFn).toHaveBeenCalledTimes(1);
        },
        (err) => {
          throw err;
        },
      );
    });
  });

  describe('tapFailure', () => {
    test('Calls the passed function but returns an original err', () => {
      const errVal = failure(12);
      const passedFn = vitest.fn((_number) => {});

      const taped = errVal.tapFailure(passedFn);

      return taped.match(
        () => {
          throw new Error('Failure should be taped');
        },
        (err) => {
          expect(err).toStrictEqual(12);
          expect(passedFn).toHaveBeenCalledTimes(1);
        },
      );
    });
  });

  describe('recover', () => {
    test('Skips recover on an Ok value', () => {
      const okVal = success(12);
      const errorCallback = vitest.fn((_errVal) => failure<number, string>('It is now a string'));

      const recovered = okVal.recover(errorCallback);

      return recovered.match(
        (result) => {
          expect(result).toEqual(12);
          expect(errorCallback).not.toHaveBeenCalled();
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Invokes the recover callback on an Err value', () => {
      const myResult = failure('BOOOM!');
      const errorCallback = vitest.fn((_errVal) => failure(true));

      const recovered = myResult.recover(errorCallback);

      return recovered.match(
        () => {
          throw new Error('recover should fail');
        },
        (err) => {
          expect(err).toEqual(true);
          expect(errorCallback).toHaveBeenCalledTimes(1);
        },
      );
    });
  });

  describe('match', () => {
    test('Matches on an Ok', () => {
      return success(12).match(
        (result) => {
          expect(result).toBe(12);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Matches on an Error', async () => {
      return failure('bad').match(
        () => {
          throw new Error('success handler should not be called');
        },
        (err) => {
          expect(err).toBe('bad');
        },
      );
    });
  });

  describe('fromFunction', () => {
    test('creates a new function that returns a ResultAsync', () => {
      const example = Outcome.fromFunction(async (a: number, b: number) => a + b);
      const res = example(4, 8);
      expect(res).toBeInstanceOf(AbstractOutcome);

      return res.match(
        (result) => {
          expect(result).toEqual(12);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('handles synchronous errors', () => {
      const example = Outcome.fromFunction(() => {
        if (1 > 0) throw new Error('Oops: No!');

        return Promise.resolve(12);
      });

      const val = example();

      return val.match(
        () => {
          throw new Error('fromThrowable should fail');
        },
        (failure) => {
          throw failure;
        },
        (defect) => {
          expect(defect).toEqual(Error('Oops: No!'));
        },
      );
    });

    test('handles asynchronous errors', () => {
      const example = Outcome.fromFunction(async () => {
        if (1 > 0) throw new Error('Oops: No!');

        return 12;
      });

      const val = example();

      return val.match(
        () => {
          throw new Error('fromThrowable should fail');
        },
        (failure) => {
          throw failure;
        },
        (defect) => {
          expect(defect).toEqual(Error('Oops: No!'));
        },
      );
    });

    test('Accepts an error handler as a second argument', () => {
      const example = Outcome.fromFunction(
        () => Promise.reject('No!'),
        (e) => new Error('Oops: ' + e),
      );

      const val = example();

      return val.match(
        () => {
          throw new Error('fromThrowable should fail');
        },
        (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message.startsWith('Oops: ')).toBe(true);
        },
      );
    });
  });

  describe('all', () => {
    test('Combines a list of Outcomes into an Ok value', async () => {
      const asyncResultList = [success(123), success(456), success(789)];

      const resultAsync: Outcome<number[], never[]> = Outcome.all(asyncResultList);

      expect(resultAsync).toBeInstanceOf(AbstractOutcome);

      return Outcome.all(asyncResultList).match(
        (result) => {
          expect(result).toEqual([123, 456, 789]);
        },
        (err) => {
          throw err;
        },
        (defect) => {
          throw defect;
        },
      );
    });

    test('Combines a list of Outcomes into an Err value', () => {
      const resultList: Outcome<number, string>[] = [
        success(123),
        failure('boooom!'),
        success(456),
        failure('ahhhhh!'),
      ];

      return Outcome.all(resultList).match(
        () => {
          throw new Error('combine should fail');
        },
        (err) => {
          expect(err).toEqual([undefined, 'boooom!', undefined, 'ahhhhh!']);
        },
        (defect) => {
          throw defect;
        },
      );
    });

    test('Combines heterogeneous lists', () => {
      type HeterogenousList = [
        Outcome<string, string>,
        Outcome<number, number>,
        Outcome<boolean, boolean>,
        Outcome<number[], string>,
      ];

      const heterogenousList: HeterogenousList = [
        success('Yooooo'),
        success(123),
        success(true),
        success([1, 2, 3]),
      ];

      Outcome.all(heterogenousList).match(
        (result) => {
          expect(result).toEqual(['Yooooo', 123, true, [1, 2, 3]]);
        },
        (err) => {
          throw err;
        },
      );
    });
  });

  describe('okAsync', () => {
    test('Creates a ResultAsync that resolves to an Ok', () => {
      const val = success(12);

      expect(val).toBeInstanceOf(AbstractOutcome);

      return val.match(
        (result) => {
          expect(result).toEqual(12);
        },
        (err) => {
          throw err;
        },
      );
    });
  });

  describe('errAsync', () => {
    test('Creates a ResultAsync that resolves to an Err', () => {
      const err = failure('bad');

      expect(err).toBeInstanceOf(AbstractOutcome);

      return err.match(
        (result) => {
          throw new Error('failure should be failed');
        },
        (err) => {
          expect(err).toEqual('bad');
        },
      );
    });
  });
});
