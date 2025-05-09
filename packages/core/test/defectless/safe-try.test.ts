import { describe, expect, test } from 'vitest';
import { safeTry, ok, success, err, failure, Ok, Err, Result, Outcome } from '../../src';

describe("Tests if README's examples work", () => {
  const okValue = 3;
  const errValue = 'err!';
  function good(): Result<number, string> {
    return ok(okValue);
  }
  function bad(): Result<number, string> {
    return err(errValue);
  }
  function promiseGood(): Promise<Result<number, string>> {
    return Promise.resolve(ok(okValue));
  }
  function promiseBad(): Promise<Result<number, string>> {
    return Promise.resolve(err(errValue));
  }
  function asyncGood(): Outcome<number, string> {
    return success(okValue);
  }
  function asyncBad(): Outcome<number, string> {
    return failure(errValue);
  }
});

describe('it yields and works without safeUnwrap', () => {
  test('With synchronous Ok', () => {
    const res: Result<string, string> = ok('ok');

    const actual = safeTry(function* () {
      const x = yield* res;
      return ok(x);
    });

    expect(actual).toBeInstanceOf(Ok);
    expect(actual._unsafeUnwrap()).toBe('ok');
  });

  test('With synchronous Err', () => {
    const res: Result<number, string> = err('error');

    const actual = safeTry(function* () {
      const x = yield* res;
      return ok(x);
    });

    expect(actual).toBeInstanceOf(Err);
    expect(actual._unsafeUnwrapErr()).toBe('error');
  });

  const okValue = 3;
  const errValue = 'err!';

  function good(): Result<number, string> {
    return ok(okValue);
  }
  function bad(): Result<number, string> {
    return err(errValue);
  }
  function promiseGood(): Promise<Result<number, string>> {
    return Promise.resolve(ok(okValue));
  }
  function promiseBad(): Promise<Result<number, string>> {
    return Promise.resolve(err(errValue));
  }
  function asyncGood(): Outcome<number, string> {
    return success(okValue);
  }
  function asyncBad(): Outcome<number, string> {
    return failure(errValue);
  }

  test('mayFail2 error', () => {
    function fn(): Result<number, string> {
      return safeTry<number, string>(function* () {
        const first = yield* good().mapErr((e) => `1st, ${e}`);
        const second = yield* bad().mapErr((e) => `2nd, ${e}`);

        return ok(first + second);
      });
    }

    const result = fn();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(`2nd, ${errValue}`);
  });

  test('all ok', () => {
    function myFunc(): Result<number, string> {
      return safeTry<number, string>(function* () {
        const first = yield* good().mapErr((e) => `1st, ${e}`);
        const second = yield* good().mapErr((e) => `2nd, ${e}`);
        return ok(first + second);
      });
    }

    const result = myFunc();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(okValue + okValue);
  });

  test('async mayFail1 error', async () => {
    function myFunc(): Outcome<number, string> {
      return safeTry<number, string>(async function* () {
        const first = yield* (await promiseBad()).mapErr((e) => `1st, ${e}`);
        const second = yield* asyncGood().mapFailure((e) => `2nd, ${e}`);
        return ok(first + second);
      });
    }

    const result = await myFunc();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(`1st, ${errValue}`);
  });

  test('async mayFail2 error', async () => {
    function myFunc(): Outcome<number, string> {
      return safeTry<number, string>(async function* () {
        const goodResult = await promiseGood();
        const value = yield* goodResult.mapErr((e) => `1st, ${e}`);
        const value2 = yield* asyncBad().mapFailure((e) => `2nd, ${e}`);

        return success(value + value2);
      });
    }

    const result = await myFunc();
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBe(`2nd, ${errValue}`);
  });

  test('promise async all ok', async () => {
    function myFunc(): Outcome<number, string> {
      return safeTry<number, string>(async function* () {
        const first = yield* (await promiseGood()).mapErr((e) => `1st, ${e}`);
        const second = yield* asyncGood().mapFailure((e) => `2nd, ${e}`);
        return ok(first + second);
      });
    }

    const result = await myFunc();
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(okValue + okValue);
  });
});
