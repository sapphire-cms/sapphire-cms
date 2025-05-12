import { describe, expect, test, vitest } from 'vitest';
import * as td from 'testdouble';
import {
  err,
  Err,
  failure,
  fromAsyncThrowable,
  fromThrowable,
  ok,
  Ok,
  Outcome,
  Result,
  success,
} from '../../src';

describe('Result.Ok', () => {
  test('Creates an Ok value', () => {
    const okVal = ok(12);

    expect(okVal.isOk()).toBe(true);
    expect(okVal.isErr()).toBe(false);
    expect(okVal).toBeInstanceOf(Ok);
  });

  test('Creates an Ok value with null', () => {
    const okVal = ok(null);

    expect(okVal.isOk()).toBe(true);
    expect(okVal.isErr()).toBe(false);
    expect(okVal._unsafeUnwrap()).toBe(null);
  });

  test('Creates an Ok value with undefined', () => {
    const okVal = ok(undefined);

    expect(okVal.isOk()).toBe(true);
    expect(okVal.isErr()).toBe(false);
    expect(okVal._unsafeUnwrap()).toBeUndefined();
  });

  test('Is comparable', () => {
    expect(ok(42)).toEqual(ok(42));
    expect(ok(42)).not.toEqual(ok(43));
  });

  test('Maps over an Ok value', () => {
    const okVal = ok(12);
    const mapFn = vitest.fn((number) => number.toString());

    const mapped = okVal.map(mapFn);

    expect(mapped.isOk()).toBe(true);
    expect(mapped._unsafeUnwrap()).toBe('12');
    expect(mapFn).toHaveBeenCalledTimes(1);
  });

  test('Skips `mapErr`', () => {
    const mapErrorFunc = vitest.fn((_error) => 'mapped error value');

    const notMapped = ok(12).mapErr(mapErrorFunc);

    expect(notMapped.isOk()).toBe(true);
    expect(mapErrorFunc).not.toHaveBeenCalledTimes(1);
  });

  describe('andThen', () => {
    test('Maps to an Ok', () => {
      const okVal = ok(12);

      const flattened = okVal.andThen((_number) => {
        // ...
        // complex logic
        // ...
        return ok({ data: 'why not' });
      });

      expect(flattened.isOk()).toBe(true);
      expect(flattened._unsafeUnwrap()).toStrictEqual({ data: 'why not' });
    });

    test('Maps to an Err', () => {
      const okval = ok(12);

      const flattened = okval.andThen((_number) => {
        // ...
        // complex logic
        // ...
        return err('Whoopsies!');
      });

      expect(flattened.isOk()).toBe(false);

      const nextFn = vitest.fn((_val) => ok('noop'));

      flattened.andThen(nextFn);

      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('andThrough', () => {
    test('Calls the passed function but returns an original ok', () => {
      const okVal = ok(12);
      const passedFn = vitest.fn((_number) => ok(undefined));

      const thrued = okVal.andThrough(passedFn);
      expect(thrued.isOk()).toBe(true);
      expect(passedFn).toHaveBeenCalledTimes(1);
      expect(thrued._unsafeUnwrap()).toStrictEqual(12);
    });

    test('Maps to an Err', () => {
      const okval = ok(12);

      const thrued = okval.andThen((_number) => {
        // ...
        // complex logic
        // ...
        return err('Whoopsies!');
      });

      expect(thrued.isOk()).toBe(false);
      expect(thrued._unsafeUnwrapErr()).toStrictEqual('Whoopsies!');

      const nextFn = vitest.fn((_val) => ok('noop'));

      thrued.andThen(nextFn);

      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('andTee', () => {
    test('Calls the passed function but returns an original ok', () => {
      const okVal = ok(12);
      const passedFn = vitest.fn((_number) => {});

      const teed = okVal.andTee(passedFn);

      expect(teed.isOk()).toBe(true);
      expect(passedFn).toHaveBeenCalledTimes(1);
      expect(teed._unsafeUnwrap()).toStrictEqual(12);
    });
    test('returns an original ok even when the passed function fails', () => {
      const okVal = ok(12);
      const passedFn = vitest.fn((_number) => {
        throw new Error('OMG!');
      });

      const teed = okVal.andTee(passedFn);

      expect(teed.isOk()).toBe(true);
      expect(passedFn).toHaveBeenCalledTimes(1);
      expect(teed._unsafeUnwrap()).toStrictEqual(12);
    });
  });

  describe('orTee', () => {
    test('Calls the passed function but returns an original err', () => {
      const errVal = err(12);
      const passedFn = vitest.fn((_number) => {});

      const teed = errVal.orTee(passedFn);

      expect(teed.isErr()).toBe(true);
      expect(passedFn).toHaveBeenCalledTimes(1);
      expect(teed._unsafeUnwrapErr()).toStrictEqual(12);
    });
    test('returns an original err even when the passed function fails', () => {
      const errVal = err(12);
      const passedFn = vitest.fn((_number) => {
        throw new Error('OMG!');
      });

      const teed = errVal.orTee(passedFn);

      expect(teed.isErr()).toBe(true);
      expect(passedFn).toHaveBeenCalledTimes(1);
      expect(teed._unsafeUnwrapErr()).toStrictEqual(12);
    });
  });

  describe('asyncAndThrough', () => {
    test('Calls the passed function but returns an original ok as Async', () => {
      const okVal = ok(12);
      const passedFn = vitest.fn((_number) => success(undefined));

      const teedAsync = okVal.asyncAndThrough(passedFn);
      expect(teedAsync).toBeInstanceOf(Outcome);

      return teedAsync.match(
        (res) => {
          expect(res).toStrictEqual(12);
          expect(passedFn).toHaveBeenCalledTimes(1);
        },
        (err) => {
          throw err;
        },
      );
    });

    test('Maps to an Err', async () => {
      const okval = ok(12);
      const nextFn = vitest.fn((_val) => ok('noop'));

      const teedAsync = okval
        .asyncAndThen((_number) => {
          // ...
          // complex logic
          // ...
          return failure('Whoopsies!');
        })
        .flatMap(nextFn);

      return teedAsync.match(
        (res) => {
          throw new Error('asyncAndThen should fail');
        },
        (err) => {
          expect(err).toStrictEqual('Whoopsies!');
          expect(nextFn).not.toHaveBeenCalled();
        },
      );
    });
  });

  describe('orElse', () => {
    test('Skips orElse on an Ok value', () => {
      const okVal = ok(12);
      const errorCallback = vitest.fn((_errVal) => err<number, string>('It is now a string'));

      expect(okVal.orElse(errorCallback)).toEqual(ok(12));
      expect(errorCallback).not.toHaveBeenCalled();
    });
  });

  test('unwrapOr and return the Ok value', () => {
    const okVal = ok(12);
    expect(okVal.unwrapOr(1)).toEqual(12);
  });

  test('Maps to a ResultAsync', async () => {
    const okVal = ok(12);

    const flattened = okVal.asyncAndThen((_number) => {
      // ...
      // complex async logic
      // ...
      return success({ data: 'why not' });
    });

    expect(flattened).toBeInstanceOf(Outcome);

    return flattened.match(
      (res) => {
        expect(res).toStrictEqual({ data: 'why not' });
      },
      (err) => {
        throw err;
      },
    );
  });

  test('Maps to a promise', async () => {
    const asyncMapper = vitest.fn((_val) => {
      // ...
      // complex logic
      // ..

      // db queries
      // network calls
      // disk io
      // etc ...
      return Promise.resolve('Very Nice!');
    });

    const okVal = ok(12);

    const promise = okVal.asyncMap(asyncMapper);

    expect(promise).toBeInstanceOf(Outcome);

    return promise.match(
      (res) => {
        expect(res).toStrictEqual('Very Nice!');
        expect(asyncMapper).toHaveBeenCalledTimes(1);
      },
      (err) => {
        throw err;
      },
    );
  });

  test('Matches on an Ok', () => {
    const okMapper = vitest.fn((_val) => 'weeeeee');
    const errMapper = vitest.fn((_val) => 'wooooo');

    const matched = ok(12).match(okMapper, errMapper);

    expect(matched).toBe('weeeeee');
    expect(okMapper).toHaveBeenCalledTimes(1);
    expect(errMapper).not.toHaveBeenCalled();
  });

  test('Unwraps without issue', () => {
    const okVal = ok(12);

    expect(okVal._unsafeUnwrap()).toBe(12);
  });

  test('Can read the value after narrowing', () => {
    const fallible: () => Result<string, number> = () => ok('safe to read');
    const val = fallible();

    // After this check we val is narrowed to Ok<string, number>. Without this
    // line TypeScript will not allow accessing val.value.
    if (val.isErr()) return;

    expect(val.value).toBe('safe to read');
  });
});

describe('Result.Err', () => {
  test('Creates an Err value', () => {
    const errVal = err('I have you now.');

    expect(errVal.isOk()).toBe(false);
    expect(errVal.isErr()).toBe(true);
    expect(errVal).toBeInstanceOf(Err);
  });

  test('Is comparable', () => {
    expect(err(42)).toEqual(err(42));
    expect(err(42)).not.toEqual(err(43));
  });

  test('Skips `map`', () => {
    const errVal = err('I am your father');

    const mapper = vitest.fn((_value) => 'noooo');

    const hopefullyNotMapped = errVal.map(mapper);

    expect(hopefullyNotMapped.isErr()).toBe(true);
    expect(mapper).not.toHaveBeenCalled();
    expect(hopefullyNotMapped._unsafeUnwrapErr()).toEqual(errVal._unsafeUnwrapErr());
  });

  test('Maps over an Err', () => {
    const errVal = err('Round 1, Fight!');

    const mapper = vitest.fn((error: string) => error.replace('1', '2'));

    const mapped = errVal.mapErr(mapper);

    expect(mapped.isErr()).toBe(true);
    expect(mapper).toHaveBeenCalledTimes(1);
    expect(mapped._unsafeUnwrapErr()).not.toEqual(errVal._unsafeUnwrapErr());
  });

  test('unwrapOr and return the default value', () => {
    const okVal = err<number, string>('Oh nooo');
    expect(okVal.unwrapOr(1)).toEqual(1);
  });

  test('Skips over andThen', () => {
    const errVal = err('Yolo');

    const mapper = vitest.fn((_val) => ok<string, string>('yooyo'));

    const hopefullyNotFlattened = errVal.andThen(mapper);

    expect(hopefullyNotFlattened.isErr()).toBe(true);
    expect(mapper).not.toHaveBeenCalled();
    expect(errVal._unsafeUnwrapErr()).toEqual('Yolo');
  });

  test('Skips over andThrough', () => {
    const errVal = err('Yolo');

    const mapper = vitest.fn((_val) => ok<void, string>(undefined));

    const hopefullyNotFlattened = errVal.andThrough(mapper);

    expect(hopefullyNotFlattened.isErr()).toBe(true);
    expect(mapper).not.toHaveBeenCalled();
    expect(errVal._unsafeUnwrapErr()).toEqual('Yolo');
  });

  test('Skips over andTee', () => {
    const errVal = err('Yolo');

    const mapper = vitest.fn((_val) => {});

    const hopefullyNotFlattened = errVal.andTee(mapper);

    expect(hopefullyNotFlattened.isErr()).toBe(true);
    expect(mapper).not.toHaveBeenCalled();
    expect(errVal._unsafeUnwrapErr()).toEqual('Yolo');
  });

  test('Skips over asyncAndThrough but returns ResultAsync instead', () => {
    const errVal = err('Yolo');

    const mapper = vitest.fn((_val) => success<string, unknown>('Async'));

    const hopefullyNotFlattened = errVal.asyncAndThrough(mapper);
    expect(hopefullyNotFlattened).toBeInstanceOf(Outcome);

    return hopefullyNotFlattened.match(
      (_) => {
        throw new Error('asyncAndThrough should fail');
      },
      (err) => {
        expect(err).toEqual('Yolo');
        expect(mapper).not.toHaveBeenCalled();
      },
    );
  });

  test('Transforms error into ResultAsync within `asyncAndThen`', () => {
    const errVal = err('Yolo');

    const asyncMapper = vitest.fn((_val) => success<string, string>('yooyo'));

    const hopefullyNotFlattened = errVal.asyncAndThen(asyncMapper);

    expect(hopefullyNotFlattened).toBeInstanceOf(Outcome);

    return hopefullyNotFlattened.match(
      (result) => {
        throw new Error('asyncAndThen should fail');
      },
      (err) => {
        expect(err).toEqual('Yolo');
        expect(asyncMapper).not.toHaveBeenCalled();
      },
    );
  });

  test('Does not invoke callback within `asyncMap`', () => {
    const asyncMapper = vitest.fn((_val) => {
      // ...
      // complex logic
      // ..

      // db queries
      // network calls
      // disk io
      // etc ...
      return Promise.resolve('Very Nice!');
    });

    const errVal = err('nooooooo');

    const promise = errVal.asyncMap(asyncMapper);

    expect(promise).toBeInstanceOf(Outcome);

    return promise.match(
      (result) => {
        throw new Error('asyncMap should fail');
      },
      (err) => {
        expect(err).toEqual(errVal._unsafeUnwrapErr());
        expect(asyncMapper).not.toHaveBeenCalled();
      },
    );
  });

  test('Matches on an Err', () => {
    const okMapper = vitest.fn((_val) => 'weeeeee');
    const errMapper = vitest.fn((_val) => 'wooooo');

    const matched = err(12).match(okMapper, errMapper);

    expect(matched).toBe('wooooo');
    expect(okMapper).not.toHaveBeenCalled();
    expect(errMapper).toHaveBeenCalledTimes(1);
  });

  test('Throws when you unwrap an Err', () => {
    const errVal = err('woopsies');

    expect(() => {
      errVal._unsafeUnwrap();
    }).toThrowError();
  });

  test('Unwraps without issue', () => {
    const okVal = err(12);

    expect(okVal._unsafeUnwrapErr()).toBe(12);
  });

  describe('orElse', () => {
    test('invokes the orElse callback on an Err value', () => {
      const okVal = err('BOOOM!');
      const errorCallback = vitest.fn((_errVal) => err(true));

      expect(okVal.orElse(errorCallback)).toEqual(err(true));
      expect(errorCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Result.fromThrowable', () => {
  test('Creates a function that returns an OK result when the inner function does not throw', () => {
    const hello = (): string => 'hello';
    const safeHello = Result.fromThrowable(hello);

    const result = hello();
    const safeResult = safeHello();

    expect(safeResult).toBeInstanceOf(Ok);
    expect(result).toEqual(safeResult._unsafeUnwrap());
  });

  // Added for issue #300 -- the test here is not so much that expectations are met as that the test compiles.
  test('Accepts an inner function which takes arguments', () => {
    const hello = (fname: string): string => `hello, ${fname}`;
    const safeHello = Result.fromThrowable(hello);

    const result = hello('Dikembe');
    const safeResult = safeHello('Dikembe');

    expect(safeResult).toBeInstanceOf(Ok);
    expect(result).toEqual(safeResult._unsafeUnwrap());
  });

  test('Creates a function that returns an err when the inner function throws', () => {
    const thrower = (): string => {
      throw new Error();
    };

    // type: () => Result<string, unknown>
    // received types from thrower fn, no errorFn is provides therefore Err type is unknown
    const safeThrower = Result.fromThrowable(thrower);
    const result = safeThrower();

    expect(result).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(Error);
  });

  test('Accepts an error handler as a second argument', () => {
    const thrower = (): string => {
      throw new Error();
    };
    type MessageObject = { message: string };
    const toMessageObject = (): MessageObject => ({ message: 'error' });

    // type: () => Result<string, MessageObject>
    // received types from thrower fn and errorFn return type
    const safeThrower = Result.fromThrowable(thrower, toMessageObject);
    const result = safeThrower();

    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    expect(result).toBeInstanceOf(Err);
    expect(result._unsafeUnwrapErr()).toEqual({ message: 'error' });
  });

  test('has a top level export', () => {
    expect(fromThrowable).toBe(Result.fromThrowable);
  });
});

describe('Utils', () => {
  describe('`Result.combine`', () => {
    describe('Synchronous `combine`', () => {
      test('Combines a list of results into an Ok value', () => {
        const resultList = [ok(123), ok(456), ok(789)];

        const result = Result.combine(resultList);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([123, 456, 789]);
      });

      test('Combines a list of results into an Err value', () => {
        const resultList: Result<number, string>[] = [
          ok(123),
          err('boooom!'),
          ok(456),
          err('ahhhhh!'),
        ];

        const result = Result.combine(resultList);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBe('boooom!');
      });

      test('Combines heterogeneous lists', () => {
        type HeterogenousList = [
          Result<string, string>,
          Result<number, number>,
          Result<boolean, boolean>,
        ];

        const heterogenousList: HeterogenousList = [ok('Yooooo'), ok(123), ok(true)];

        type ExpecteResult = Result<[string, number, boolean], string | number | boolean>;

        const result: ExpecteResult = Result.combine(heterogenousList);

        expect(result._unsafeUnwrap()).toEqual(['Yooooo', 123, true]);
      });

      test('Does not destructure / concatenate arrays', () => {
        type HomogenousList = [Result<string[], boolean>, Result<number[], string>];

        const homogenousList: HomogenousList = [ok(['hello', 'world']), ok([1, 2, 3])];

        type ExpectedResult = Result<[string[], number[]], boolean | string>;

        const result: ExpectedResult = Result.combine(homogenousList);

        expect(result._unsafeUnwrap()).toEqual([
          ['hello', 'world'],
          [1, 2, 3],
        ]);
      });
    });

    describe('`ResultAsync.combine`', () => {
      test('Combines a list of async results into an Ok value', async () => {
        const asyncResultList = [success(123), success(456), success(789)];

        const resultAsync: Outcome<number[], never[]> = Outcome.combine(asyncResultList);

        expect(resultAsync).toBeInstanceOf(Outcome);

        return Outcome.combine(asyncResultList).match(
          (result) => {
            expect(result).toEqual([123, 456, 789]);
          },
          (err) => {
            throw err;
          },
        );
      });

      test('Combines a list of results into an Err value', () => {
        const resultList: Outcome<number, string>[] = [
          success(123),
          failure('boooom!'),
          success(456),
          failure('ahhhhh!'),
        ];

        return Outcome.combine(resultList).match(
          (_) => {
            throw new Error('combine should fail');
          },
          (err) => {
            expect(err).toBe('boooom!');
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

        Outcome.combine(heterogenousList).match(
          (result) => {
            expect(result).toEqual(['Yooooo', 123, true, [1, 2, 3]]);
          },
          (err) => {
            throw err;
          },
        );
      });
    });
  });
  describe('`Result.combineWithAllErrors`', () => {
    describe('Synchronous `combineWithAllErrors`', () => {
      test('Combines a list of results into an Ok value', () => {
        const resultList = [ok(123), ok(456), ok(789)];

        return Result.combineWithAllErrors(resultList).match(
          (result) => {
            expect(result).toEqual([123, 456, 789]);
          },
          (err) => {
            throw err;
          },
        );
      });

      test('Combines a list of results into an Err value', () => {
        const resultList: Result<number, string>[] = [
          ok(123),
          err('boooom!'),
          ok(456),
          err('ahhhhh!'),
        ];

        return Result.combineWithAllErrors(resultList).match(
          (_) => {
            throw new Error('combineWithAllErrors should fail');
          },
          (err) => {
            expect(err).toEqual(['boooom!', 'ahhhhh!']);
          },
        );
      });

      test('Combines heterogeneous lists', () => {
        type HeterogenousList = [
          Result<string, string>,
          Result<number, number>,
          Result<boolean, boolean>,
        ];

        const heterogenousList: HeterogenousList = [ok('Yooooo'), ok(123), ok(true)];

        type ExpecteResult = Result<[string, number, boolean], (string | number | boolean)[]>;

        const result: ExpecteResult = Result.combineWithAllErrors(heterogenousList);

        expect(result._unsafeUnwrap()).toEqual(['Yooooo', 123, true]);
      });

      test('Does not destructure / concatenate arrays', () => {
        type HomogenousList = [Result<string[], boolean>, Result<number[], string>];

        const homogenousList: HomogenousList = [ok(['hello', 'world']), ok([1, 2, 3])];

        type ExpectedResult = Result<[string[], number[]], (boolean | string)[]>;

        const result: ExpectedResult = Result.combineWithAllErrors(homogenousList);

        expect(result._unsafeUnwrap()).toEqual([
          ['hello', 'world'],
          [1, 2, 3],
        ]);
      });
    });

    describe('testdouble `ResultAsync.combine`', () => {
      interface ITestInterface {
        getName(): string;
        setName(name: string): void;
        getAsyncResult(): Outcome<ITestInterface, Error>;
      }

      test('Combines `testdouble` proxies from mocks generated via interfaces', () => {
        const mock = td.object<ITestInterface>();

        const combined = Outcome.combine([success(mock)] as const);

        expect(combined).toBeDefined();

        return combined.match(
          (result) => {
            expect(result.length).toBe(1);
            expect(result[0]).toBe(mock);
          },
          (err) => {
            throw err;
          },
        );
      });
    });
  });
});

describe('ResultAsync', () => {
  describe('map', () => {
    test('Maps a value using a synchronous function', () => {
      const asyncVal = success(12);

      const mapSyncFn = vitest.fn((number) => number.toString());

      const mapped = asyncVal.map(mapSyncFn);

      expect(mapped).toBeInstanceOf(Outcome);

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

    test('Maps a value using an asynchronous function', () => {
      const asyncVal = success(12);

      const mapAsyncFn = vitest.fn((number) => Promise.resolve(number.toString()));

      const mapped = asyncVal.map(mapAsyncFn);

      expect(mapped).toBeInstanceOf(Outcome);

      return mapped.match(
        (result) => {
          expect(result).toBe('12');
          expect(mapAsyncFn).toHaveBeenCalledTimes(1);
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

      expect(notMapped).toBeInstanceOf(Outcome);

      return notMapped.match(
        (_) => {
          throw new Error('map should fail');
        },
        (err) => {
          expect(err).toBe('Wrong format');
          expect(mapSyncFn).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('mapErr', () => {
    test('Maps an error using a synchronous function', () => {
      const asyncErr = failure('Wrong format');

      const mapErrSyncFn = vitest.fn((str) => 'Error: ' + str);

      const mappedErr = asyncErr.mapFailure(mapErrSyncFn);

      expect(mappedErr).toBeInstanceOf(Outcome);

      return mappedErr.match(
        (_) => {
          throw new Error('mapFailure should return failure');
        },
        (err) => {
          expect(err).toBe('Error: Wrong format');
          expect(mapErrSyncFn).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('Maps an error using an asynchronous function', () => {
      const asyncErr = failure('Wrong format');

      const mapErrAsyncFn = vitest.fn((str) => Promise.resolve('Error: ' + str));

      const mappedErr = asyncErr.mapFailure(mapErrAsyncFn);

      expect(mappedErr).toBeInstanceOf(Outcome);

      return mappedErr.match(
        (_) => {
          throw new Error('mapFailure should return failure');
        },
        (err) => {
          expect(err).toBe('Error: Wrong format');
          expect(mapErrAsyncFn).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('Skips a value', () => {
      const asyncVal = success(12);

      const mapErrSyncFn = vitest.fn((str) => 'Error: ' + str);

      const notMapped = asyncVal.mapFailure(mapErrSyncFn);

      expect(notMapped).toBeInstanceOf(Outcome);

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

  describe('andThen', () => {
    test('Maps a value using a function returning a ResultAsync', () => {
      const asyncVal = success(12);

      const andThenResultAsyncFn = vitest.fn(() => success('good'));

      const mapped = asyncVal.flatMap(andThenResultAsyncFn);

      expect(mapped).toBeInstanceOf(Outcome);

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

    test('Maps a value using a function returning a Result', () => {
      const asyncVal = success(12);

      const andThenResultFn = vitest.fn(() => ok('good'));

      const mapped = asyncVal.flatMap(andThenResultFn);

      expect(mapped).toBeInstanceOf(Outcome);

      return mapped.match(
        (result) => {
          expect(result).toBe('good');
          expect(andThenResultFn).toHaveBeenCalledTimes(1);
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

      expect(notMapped).toBeInstanceOf(Outcome);

      return notMapped.match(
        (_) => {
          throw new Error('andThen should fail');
        },
        (err) => {
          expect(err).toBe('Wrong format');
          expect(andThenResultFn).toHaveBeenCalledTimes(0);
        },
      );
    });
  });

  describe('andThrough', () => {
    test('Returns the original value when map function returning ResultAsync succeeds', () => {
      const asyncVal = success(12);
      /*
        A couple examples of this function

        DB persistence (create or update)
        API calls (create or update)
      */
      const andThroughResultAsyncFn = vitest.fn(() => success('good'));

      const passedThrough = asyncVal.through(andThroughResultAsyncFn);

      expect(passedThrough).toBeInstanceOf(Outcome);

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

      expect(passedThrough).toBeInstanceOf(Outcome);

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

      const andThroughResultFn = vitest.fn(() => ok('good'));

      const passedThrough = asyncVal.through(andThroughResultFn);

      expect(passedThrough).toBeInstanceOf(Outcome);

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

      const andThroughResultFn = vitest.fn(() => err('oh no!'));

      const passedThrough = asyncVal.through(andThroughResultFn);

      expect(passedThrough).toBeInstanceOf(Outcome);

      return passedThrough.match(
        (_) => {
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

      const andThroughResultFn = vitest.fn(() => ok<string, string>('good'));

      const notMapped = asyncVal.through(andThroughResultFn);

      expect(notMapped).toBeInstanceOf(Outcome);

      return notMapped.match(
        (_) => {
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

    test('returns an original ok even when the passed function fails', () => {
      const okVal = success(12);
      const passedFn = vitest.fn((_number) => {
        throw new Error('OMG!');
      });

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
        (_) => {
          throw new Error('Failure should be taped');
        },
        (err) => {
          expect(err).toStrictEqual(12);
          expect(passedFn).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('returns an original err even when the passed function fails', () => {
      const errVal = failure(12);
      const passedFn = vitest.fn((_number) => {
        throw new Error('OMG!');
      });

      const taped = errVal.tapFailure(passedFn);

      return taped.match(
        (_) => {
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
        (_) => {
          throw new Error('recover should fail');
        },
        (err) => {
          expect(err).toEqual(true);
          expect(errorCallback).toHaveBeenCalledTimes(1);
        },
      );
    });

    test('Accepts a regular Result in the callback', () => {
      const myResult = failure('BOOOM!');
      const errorCallback = vitest.fn((_errVal) => err(true));

      const recovered = myResult.recover(errorCallback);

      return recovered.match(
        (_) => {
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
    test('Matches on an Ok', async () => {
      const okMapper = vitest.fn((_val) => 'weeeeee');
      const errMapper = vitest.fn((_val) => 'wooooo');

      const matched = await success(12).match(okMapper, errMapper);

      expect(matched).toBe('weeeeee');
      expect(okMapper).toHaveBeenCalledTimes(1);
      expect(errMapper).not.toHaveBeenCalled();
    });

    test('Matches on an Error', async () => {
      const okMapper = vitest.fn((_val) => 'weeeeee');
      const errMapper = vitest.fn((_val) => 'wooooo');

      const matched = await failure('bad').match(okMapper, errMapper);

      expect(matched).toBe('wooooo');
      expect(okMapper).not.toHaveBeenCalled();
      expect(errMapper).toHaveBeenCalledTimes(1);
    });
  });

  describe('unwrapOr', () => {
    test('returns a promise to the result value on an Ok', async () => {
      const unwrapped = await success(12).unwrapOr(10);
      expect(unwrapped).toBe(12);
    });

    test('returns a promise to the provided default value on an Error', async () => {
      const unwrapped = await failure<number, number>(12).unwrapOr(10);
      expect(unwrapped).toBe(10);
    });
  });

  describe('ResultAsync.fromThrowable', () => {
    test('creates a new function that returns a ResultAsync', () => {
      const example = Outcome.fromFunction(async (a: number, b: number) => a + b);
      const res = example(4, 8);
      expect(res).toBeInstanceOf(Outcome);

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
        (_) => {
          throw new Error('fromThrowable should fail');
        },
        (err) => {
          expect(err).toEqual(Error('Oops: No!'));
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
        (_) => {
          throw new Error('fromThrowable should fail');
        },
        (err) => {
          expect(err).toEqual(Error('Oops: No!'));
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
        (_) => {
          throw new Error('fromThrowable should fail');
        },
        (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err.message.startsWith('Oops: ')).toBe(true);
        },
      );
    });
  });

  describe('okAsync', () => {
    test('Creates a ResultAsync that resolves to an Ok', () => {
      const val = success(12);

      expect(val).toBeInstanceOf(Outcome);

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

      expect(err).toBeInstanceOf(Outcome);

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
