import { describe, expect, expectTypeOf, test, vi } from 'vitest';
import { Outcome, success, failure, AsyncOutcome, SyncOutcome } from '../src';
import { expectSuccess, expectFailure, expectDefect } from './test-utils';

describe('Outcome', () => {
  describe('map', () => {
    test('overloaded methods signatures', () => {
      const outcome = success(42) as Outcome<number, string>;

      const mapped = outcome.map((value) => 'value-' + value);

      expectTypeOf(mapped).toEqualTypeOf<Outcome<string, string>>();
    });
  });

  describe('tap', () => {
    test('overloaded methods signatures', () => {
      const outcome = success(42) as Outcome<number, string>;

      const mapped = outcome.tap((value) => 'value-' + value);

      expectTypeOf(mapped).toEqualTypeOf<Outcome<number, string>>();
    });
  });

  describe('mapFailure', () => {
    test('overloaded methods signatures', () => {
      const outcome = success(42) as Outcome<number, number>;

      const mapped = outcome.mapFailure((err) => 'err-' + err);

      expectTypeOf(mapped).toEqualTypeOf<Outcome<number, string>>();
    });
  });

  describe('tapFailure', () => {
    test('overloaded methods signatures', () => {
      const outcome = success(42) as Outcome<number, number>;

      const mapped = outcome.tapFailure((err) => 'err-' + err);

      expectTypeOf(mapped).toEqualTypeOf<Outcome<number, number>>();
    });
  });

  describe('recover', () => {
    test('overloaded methods signatures', () => {
      const outcome: Outcome<number, string> = failure('ooups!');

      // When error type is explicit
      const recovered1 = outcome.recover<DatabaseError>(() => success(42));
      expectTypeOf(recovered1).toEqualTypeOf<Outcome<number, DatabaseError>>();

      // Infer from recoverer result
      const recovered2 = outcome.recover(
        () => success(42) as Outcome<number, MissingContractError>,
      );
      expectTypeOf(recovered2).toEqualTypeOf<Outcome<number, MissingContractError>>();

      // Infer from the assignment context
      const recovered3: Outcome<number, InvalidOfferError> = outcome.recover(() => success(42));
      expectTypeOf(recovered3).toEqualTypeOf<Outcome<number, MissingContractError>>();
    });
  });

  describe('flatMap', () => {
    test('overloaded methods signatures', () => {
      const outcome: Outcome<number, BusinessError> = success(42);

      // When types are explicit
      const flatMapped1 = outcome.flatMap<string, ProcessError>((value) =>
        success('value-' + value),
      );
      expectTypeOf(flatMapped1).toEqualTypeOf<Outcome<string, BusinessError | ProcessError>>();

      // Infer from operation result
      const flatMapped2 = outcome.flatMap(
        (value) => success('value-' + value) as Outcome<string, DatabaseError>,
      );
      expectTypeOf(flatMapped2).toEqualTypeOf<Outcome<string, BusinessError | DatabaseError>>();

      // Infer from the assignment context
      const flatMapped3: Outcome<string, BusinessError | ProcessError> = outcome.flatMap((value) =>
        success('value-' + value),
      );
      expectTypeOf(flatMapped3).toEqualTypeOf<Outcome<string, BusinessError | ProcessError>>();
    });
  });

  describe('through', () => {
    test('overloaded methods signatures', () => {
      const outcome: Outcome<number, BusinessError> = success(42);

      // When error type is explicit
      const throughed1 = outcome.through<ProcessError>((value) => success('value-' + value));
      expectTypeOf(throughed1).toEqualTypeOf<Outcome<number, BusinessError | ProcessError>>();

      // Infer from operation result
      const throughed2 = outcome.through(
        (value) => success('value-' + value) as Outcome<string, DatabaseError>,
      );
      expectTypeOf(throughed2).toEqualTypeOf<Outcome<number, BusinessError | DatabaseError>>();

      // Infer from the assignment context
      const throughed3: Outcome<number, BusinessError | ProcessError> = outcome.through((value) =>
        success('value-' + value),
      );
      expectTypeOf(throughed3).toEqualTypeOf<Outcome<number, BusinessError | ProcessError>>();
    });
  });

  describe('finally', () => {
    test('overloaded methods signatures', () => {
      const outcome: Outcome<number, BusinessError> = success(42);

      // When error type is explicit
      const finalized1 = outcome.finally<ProcessError>(() => success());
      expectTypeOf(finalized1).toEqualTypeOf<Outcome<number, BusinessError | ProcessError>>();

      // Infer from operation result
      const finalized2 = outcome.finally(
        () => success('some result') as Outcome<string, DatabaseError>,
      );
      expectTypeOf(finalized2).toEqualTypeOf<Outcome<number, BusinessError | DatabaseError>>();

      // Infer from the assignment context
      const finalized3: Outcome<number, BusinessError | ProcessError> = outcome.finally(() =>
        success('some result'),
      );
      expectTypeOf(finalized3).toEqualTypeOf<Outcome<number, BusinessError | ProcessError>>();
    });
  });

  describe('fromSupplier', () => {
    describe('when supplier returns PromiseLike', () => {
      describe('when supplier returns succeeded Promise', () => {
        test('should return succeeded AsyncOutcome', async () => {
          const supplier = vi.fn(() => Promise.resolve(42));
          const errorFn = vi.fn((err: unknown) => 'error-' + err);

          const outcome = Outcome.fromSupplier(supplier, errorFn);

          expect(outcome).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectSuccess(outcome, 42);

          expect(supplier).toHaveBeenCalledTimes(1);
          expect(errorFn).not.toHaveBeenCalled();
        });
      });

      describe('when supplier returns failed Promise', () => {
        describe('when errorFn is provided', () => {
          test('should return failed AsyncOutcome', async () => {
            const promiseError = 'promise error';
            const supplier = vi.fn(() => Promise.reject(promiseError));
            const errorFn = vi.fn((err: unknown) => 'error-' + err);

            const outcome = Outcome.fromSupplier(supplier, errorFn);

            expect(outcome).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<never, string>>();

            await expectFailure(outcome, 'error-' + promiseError);

            expect(supplier).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(promiseError);
          });
        });

        describe('when errorFn is missing', () => {
          test('should return defected AsyncOutcome', async () => {
            const promiseError = 'promise error';
            const supplier = vi.fn(() => Promise.reject(promiseError));

            const outcome = Outcome.fromSupplier<number, unknown>(supplier);

            expect(outcome).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, unknown>>();

            await expectDefect(outcome, promiseError);

            expect(supplier).toHaveBeenCalledTimes(1);
          });
        });

        describe('when errorFn is provided and its execution fails', () => {
          test('should return defected AsyncOutcome', async () => {
            const promiseError = 'promise error';
            const errorFnError = 'error handler error';
            const supplier = vi.fn(() => Promise.reject(promiseError));
            const errorFn = vi.fn((err: unknown) => {
              throw errorFnError;
              return 'error-' + err;
            });

            const outcome = Outcome.fromSupplier(supplier, errorFn);

            expect(outcome).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<never, string>>();

            await expectDefect(outcome, errorFnError);

            expect(supplier).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(promiseError);
          });
        });
      });

      describe('when supplier throws error', () => {
        describe('when errorFn is provided', () => {
          test('should return failed Outcome', async () => {
            const throwError = 'throw error';
            const supplier = vi.fn((): Promise<number> => {
              throw throwError;
            });
            const errorFn = vi.fn((err: unknown) => 'error-' + err);

            const outcome = Outcome.fromSupplier(supplier, errorFn);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectFailure(outcome, 'error-' + throwError);

            expect(supplier).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(throwError);
          });
        });

        describe('when errorFn is missing', () => {
          test('should return defected Outcome', async () => {
            const throwError = 'throw error';
            const supplier = vi.fn((): Promise<number> => {
              throw throwError;
            });

            const outcome = Outcome.fromSupplier(supplier);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, never>>();

            await expectDefect(outcome, throwError);

            expect(supplier).toHaveBeenCalledTimes(1);
          });
        });

        describe('when errorFn is provided and its execution fails', () => {
          test('should return defected AsyncOutcome', async () => {
            const throwError = 'throw error';
            const supplier = vi.fn((): Promise<number> => {
              throw throwError;
            });

            const errorFnError = 'error handler error';
            const errorFn = vi.fn((err: unknown) => {
              throw errorFnError;
              return 'error-' + err;
            });

            const outcome = Outcome.fromSupplier(supplier, errorFn);

            // Here is the corner case of type mismatch
            // User is expecting AsyncOutcome while method returns defected SyncOutcome
            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectDefect(outcome, errorFnError);

            expect(supplier).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(throwError);
          });
        });
      });
    });

    describe('when supplier returns plain object', () => {
      describe('when supplier returns object', () => {
        test('should return succeeded SyncOutcome', async () => {
          const supplier = vi.fn(() => 42);
          const errorFn = vi.fn((err: unknown) => 'error-' + err);

          const outcome = Outcome.fromSupplier(supplier, errorFn);

          expect(outcome).toBeInstanceOf(SyncOutcome);
          expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectSuccess(outcome, 42);

          expect(supplier).toHaveBeenCalledTimes(1);
          expect(errorFn).not.toHaveBeenCalled();
        });
      });

      describe('when supplier throws error', () => {
        describe('when errorFn is provided', () => {
          test('should return failed SyncOutcome', async () => {
            const testError = 'test error';
            const supplier = vi.fn((): number => {
              throw testError;
            });
            const errorFn = vi.fn((err: unknown) => 'error-' + err);

            const outcome = Outcome.fromSupplier(supplier, errorFn);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<number, string>>();

            await expectFailure(outcome, 'error-' + testError);

            expect(supplier).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(testError);
          });
        });

        describe('when errorFn is missing', () => {
          test('should return defected SyncOutcome', async () => {
            const testError = 'test error';
            const supplier = vi.fn((): number => {
              throw testError;
            });

            const outcome = Outcome.fromSupplier(supplier);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<number, never>>();

            await expectDefect(outcome, testError);

            expect(supplier).toHaveBeenCalledTimes(1);
          });
        });

        describe('when errorFn is provided and its execution fails', () => {
          test('should return defected SyncOutcome', async () => {
            const throwError = 'throw error';
            const supplier = vi.fn((): number => {
              throw throwError;
            });

            const errorFnError = 'error handler error';
            const errorFn = vi.fn((err: unknown) => {
              throw errorFnError;
              return 'error-' + err;
            });

            const outcome = Outcome.fromSupplier(supplier, errorFn);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<number, string>>();

            await expectDefect(outcome, errorFnError);

            expect(supplier).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(throwError);
          });
        });
      });
    });

    test('overloaded methods signatures', () => {
      // Supplier returns plain value, no errorFn
      const outcome1 = Outcome.fromSupplier(() => 'hello');

      expect(outcome1).toBeInstanceOf(SyncOutcome);
      expectTypeOf(outcome1).toEqualTypeOf<SyncOutcome<string, never>>();

      // Supplier returns plain value, with errorFn
      const outcome2 = Outcome.fromSupplier(
        () => 42,
        (_err) => 'error happened',
      );

      expect(outcome2).toBeInstanceOf(SyncOutcome);
      expectTypeOf(outcome2).toEqualTypeOf<SyncOutcome<number, string>>();

      // Supplier returns Promise, no errorFn
      const outcome3 = Outcome.fromSupplier(() => Promise.resolve('hello'));

      expect(outcome3).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome3).toEqualTypeOf<AsyncOutcome<string, never>>();

      // Supplier returns Promise, with errorFn
      const outcome4 = Outcome.fromSupplier(
        () => Promise.resolve(42),
        (_err) => 'error happened',
      );

      expect(outcome4).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome4).toEqualTypeOf<AsyncOutcome<number, string>>();
    });
  });

  describe('fromFunction', () => {
    describe('when producing function returns PromiseLike', () => {
      describe('when producing function returns succeeded Promise', () => {
        test('should return succeeded AsyncOutcome', async () => {
          const producingFunction = vi.fn((x: number, y: string) => Promise.resolve(`${x}-${y}`));
          const errorFn = vi.fn((err: unknown) => 'error-' + err);

          const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
          const outcome = wrappedFunction(42, 'test');

          expect(outcome).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<string, string>>();

          await expectSuccess(outcome, '42-test');

          expect(producingFunction).toHaveBeenCalledTimes(1);
          expect(producingFunction).toHaveBeenCalledWith(42, 'test');
          expect(errorFn).not.toHaveBeenCalled();
        });
      });

      describe('when producing function returns failed Promise', () => {
        describe('when errorFn is provided', () => {
          test('should return failed AsyncOutcome', async () => {
            const promiseError = 'promise error';
            const producingFunction = vi.fn(
              (x: number): Promise<number> => Promise.reject(promiseError),
            );
            const errorFn = vi.fn((err: unknown) => 'error-' + err);

            const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectFailure(outcome, 'error-' + promiseError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(producingFunction).toHaveBeenCalledWith(42);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(promiseError);
          });
        });

        describe('when errorFn is missing', () => {
          test('should return defected AsyncOutcome', async () => {
            const promiseError = 'promise error';
            const producingFunction = vi.fn(
              (x: number): Promise<number> => Promise.reject(promiseError),
            );

            const wrappedFunction = Outcome.fromFunction(producingFunction);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, never>>();

            await expectDefect(outcome, promiseError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(producingFunction).toHaveBeenCalledWith(42);
          });
        });

        describe('when errorFn is provided and its execution fails', () => {
          test('should return defected AsyncOutcome', async () => {
            const promiseError = 'promise error';
            const errorFnError = 'error handler error';
            const producingFunction = vi.fn(
              (x: number): Promise<number> => Promise.reject(promiseError),
            );
            const errorFn = vi.fn((err: unknown) => {
              throw errorFnError;
              return 'error-' + err;
            });

            const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectDefect(outcome, errorFnError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(promiseError);
          });
        });
      });

      describe('when producing function throws error', () => {
        describe('when errorFn is provided', () => {
          test('should return failed Outcome', async () => {
            const throwError = 'throw error';
            const producingFunction = vi.fn((x: number): Promise<string> => {
              throw throwError;
            });
            const errorFn = vi.fn((err: unknown) => 'error-' + err);

            const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<string, string>>();

            await expectFailure(outcome, 'error-' + throwError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(producingFunction).toHaveBeenCalledWith(42);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(throwError);
          });
        });

        describe('when errorFn is missing', () => {
          test('should return defected Outcome', async () => {
            const throwError = 'throw error';
            const producingFunction = vi.fn((x: number): Promise<string> => {
              throw throwError;
            });

            const wrappedFunction = Outcome.fromFunction(producingFunction);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<string, never>>();

            await expectDefect(outcome, throwError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(producingFunction).toHaveBeenCalledWith(42);
          });
        });

        describe('when errorFn is provided and its execution fails', () => {
          test('should return defected Outcome', async () => {
            const throwError = 'throw error';
            const producingFunction = vi.fn((x: number): Promise<string> => {
              throw throwError;
            });

            const errorFnError = 'error handler error';
            const errorFn = vi.fn((err: unknown) => {
              throw errorFnError;
              return 'error-' + err;
            });

            const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
            const outcome = wrappedFunction(42);

            // Here is the corner case of type mismatch
            // User is expecting AsyncOutcome while method returns defected SyncOutcome
            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<AsyncOutcome<string, string>>();

            await expectDefect(outcome, errorFnError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(throwError);
          });
        });
      });
    });

    describe('when producing function returns a plain object', () => {
      describe('when function returns object', () => {
        test('should return succeeded SyncOutcome', async () => {
          const producingFunction = vi.fn((x: number, y: string) => `${x}-${y}`);
          const errorFn = vi.fn((err: unknown) => 'error-' + err);

          const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
          const outcome = wrappedFunction(42, 'test');

          expect(outcome).toBeInstanceOf(SyncOutcome);
          expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<string, string>>();

          await expectSuccess(outcome, '42-test');

          expect(producingFunction).toHaveBeenCalledTimes(1);
          expect(producingFunction).toHaveBeenCalledWith(42, 'test');
          expect(errorFn).not.toHaveBeenCalled();
        });
      });

      describe('when function throws error', () => {
        describe('when errorFn is provided', () => {
          test('should return failed SyncOutcome', async () => {
            const testError = 'test error';
            const producingFunction = vi.fn((x: number): string => {
              throw testError;
            });
            const errorFn = vi.fn((err: unknown) => 'error-' + err);

            const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<string, string>>();

            await expectFailure(outcome, 'error-' + testError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(producingFunction).toHaveBeenCalledWith(42);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(testError);
          });
        });

        describe('when errorFn is missing', () => {
          test('should return defected SyncOutcome', async () => {
            const testError = 'test error';
            const producingFunction = vi.fn((x: number): string => {
              throw testError;
            });

            const wrappedFunction = Outcome.fromFunction(producingFunction);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<string, never>>();

            await expectDefect(outcome, testError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(producingFunction).toHaveBeenCalledWith(42);
          });
        });

        describe('when errorFn is provided and its execution fails', () => {
          test('should return defected SyncOutcome', async () => {
            const throwError = 'throw error';
            const producingFunction = vi.fn((x: number): string => {
              throw throwError;
            });

            const errorFnError = 'error handler error';
            const errorFn = vi.fn((err: unknown) => {
              throw errorFnError;
              return 'error-' + err;
            });

            const wrappedFunction = Outcome.fromFunction(producingFunction, errorFn);
            const outcome = wrappedFunction(42);

            expect(outcome).toBeInstanceOf(SyncOutcome);
            expectTypeOf(outcome).toEqualTypeOf<SyncOutcome<string, string>>();

            await expectDefect(outcome, errorFnError);

            expect(producingFunction).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledTimes(1);
            expect(errorFn).toHaveBeenCalledWith(throwError);
          });
        });
      });
    });

    test('overloaded methods signatures', () => {
      // Producing function returns plain value, no errorFn
      const outcome1 = Outcome.fromFunction((a: number, b: number) => a / b)(10, 2);

      expect(outcome1).toBeInstanceOf(SyncOutcome);
      expectTypeOf(outcome1).toEqualTypeOf<SyncOutcome<number, never>>();

      // Producing function returns plain value, with errorFn
      const outcome2 = Outcome.fromFunction(
        (a: number, b: number) => a / b,
        (_err) => 'Division error',
      )(99, 3);

      expect(outcome2).toBeInstanceOf(SyncOutcome);
      expectTypeOf(outcome2).toEqualTypeOf<SyncOutcome<number, string>>();

      // Producing function returns a Promise, no errorFn
      const outcome3 = Outcome.fromFunction((a: number, b: number) => Promise.resolve(a / b))(
        10,
        2,
      );

      expect(outcome3).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome3).toEqualTypeOf<AsyncOutcome<number, never>>();

      // Producing function returns a Promise, with errorFn
      const outcome4 = Outcome.fromFunction(
        (a: number, b: number) => Promise.resolve(a / b),
        (_err) => 'Division error',
      )(99, 3);

      expect(outcome4).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(outcome4).toEqualTypeOf<AsyncOutcome<number, string>>();
    });
  });

  describe('all', () => {
    describe('when all outcomes are sync', () => {
      test('should return SyncOutcome', () => {
        const outcome = Outcome.all([success(1), failure('ooups!'), success(2), success(3)]);

        expect(outcome).toBeInstanceOf(SyncOutcome);
        expectTypeOf(outcome).toExtend<SyncOutcome<number[], (string | undefined)[]>>();

        return expectFailure(outcome, [undefined, 'ooups!', undefined, undefined]);
      });
    });

    describe('when outcomes are mixed sync and async', () => {
      test('should return AsyncOutcome', () => {
        const outcome = Outcome.all([async(1), failure('ooups!'), async(2), async(3)]);

        expect(outcome).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(outcome).toExtend<Outcome<number[], (string | undefined)[]>>();

        return expectFailure(outcome, [undefined, 'ooups!', undefined, undefined]);
      });
    });
  });
});

function async(result: number): AsyncOutcome<number, string> {
  return AsyncOutcome.fromCallback<number, string>((onSuccess) => {
    onSuccess(result);
  });
}

class Error {}
class BusinessError extends Error {}
class TechError extends Error {}
class InvalidOfferError extends BusinessError {}
class MissingContractError extends BusinessError {}
class DatabaseError extends TechError {}
class ProcessError extends TechError {}
