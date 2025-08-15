import { AsyncOutcome, SyncOutcome } from '../src';
import { expectDefect, expectFailure, expectSuccess } from './test-utils';
import { beforeEach, describe, expect, expectTypeOf, test, vi } from 'vitest';

describe('AsyncOutcome', () => {
  describe('fromCallback', () => {
    test('when onSuccess called', () => {
      const asyncOutcome = AsyncOutcome.fromCallback<number, never>((onSuccess) => {
        onSuccess(42);
      });

      expect(asyncOutcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(asyncOutcome).toEqualTypeOf<AsyncOutcome<number, never>>();

      return expectSuccess<number>(asyncOutcome, 42);
    });

    test('when onFailure called', () => {
      const asyncOutcome = AsyncOutcome.fromCallback<never, string>((_onSuccess, onFailure) => {
        onFailure('ooups!');
      });

      expect(asyncOutcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(asyncOutcome).toEqualTypeOf<AsyncOutcome<never, string>>();

      return expectFailure<string>(asyncOutcome, 'ooups!');
    });

    test('when exception thrown', () => {
      const asyncOutcome = AsyncOutcome.fromCallback<never, never>(() => {
        throw 'bug!';
      });

      expect(asyncOutcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(asyncOutcome).toEqualTypeOf<AsyncOutcome<never, never>>();

      return expectDefect(asyncOutcome, 'bug!');
    });
  });

  describe('all', () => {
    test('when all successful', () => {
      const asyncOutcome = AsyncOutcome.all([
        succeeded(1),
        succeeded(2),
        succeeded(3),
        succeeded(4),
        succeeded(5),
      ]);

      expect(asyncOutcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(asyncOutcome).toExtend<AsyncOutcome<number[], (string | undefined)[]>>();

      return expectSuccess<number[]>(asyncOutcome, [1, 2, 3, 4, 5]);
    });

    test('when some failed', () => {
      const asyncOutcome = AsyncOutcome.all([
        succeeded(1),
        failed('fail 1'),
        succeeded(3),
        failed('fail 2'),
        succeeded(5),
      ]);

      expect(asyncOutcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(asyncOutcome).toExtend<AsyncOutcome<number[], (string | undefined)[]>>();

      return expectFailure<(string | undefined)[]>(asyncOutcome, [
        undefined,
        'fail 1',
        undefined,
        'fail 2',
        undefined,
      ]);
    });

    test('when some defected', () => {
      const asyncOutcome = AsyncOutcome.all([
        succeeded(1),
        failed('fail 1'),
        succeeded(3),
        defected(),
        succeeded(5),
      ]);

      expect(asyncOutcome).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(asyncOutcome).toExtend<AsyncOutcome<number[], (string | undefined)[]>>();

      return expectDefect(asyncOutcome, 'bug!');
    });
  });

  describe('map', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      test('when transformation succeeds should return outcome with transformed result', async () => {
        const transformation = vi.fn((value) => 'mapped-' + value);
        const mapped = asyncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<string, string>>();

        await expectSuccess<string>(mapped, 'mapped-42');
        expect(transformation).toHaveBeenCalledOnce();
        expect(transformation).toHaveBeenCalledWith(42);
      });

      test('when transformation throws error should return defected outcome', async () => {
        const transformation = vi.fn((): string => {
          throw 'error occurred!';
        });
        const mapped = asyncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<string, string>>();

        await expectDefect(mapped, 'error occurred!');
        expect(transformation).toHaveBeenCalledOnce();
        expect(transformation).toHaveBeenCalledWith(42);
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      test('transformation should not be executed and same failed outcome returned', () => {
        const transformation = vi.fn((value) => 'mapped-' + value);
        const mapped = asyncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<string, string>>();
        expect(transformation).not.toHaveBeenCalled();

        return expectFailure(mapped, 'ooups!');
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('transformation should not be executed and same defected outcome returned', () => {
        const transformation = vi.fn((value) => 'mapped-' + value);
        const mapped = asyncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<string, string>>();
        expect(transformation).not.toHaveBeenCalled();

        return expectDefect(mapped, 'bug!');
      });
    });
  });

  describe('tap', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      test('when consumer succeeds should return the same outcome', async () => {
        const consumer = vi.fn((value) => 'tapped-' + value);
        const tapped = asyncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();

        await expectSuccess<number>(tapped, 42);
        expect(consumer).toHaveBeenCalledOnce();
        expect(consumer).toHaveBeenCalledWith(42);
      });

      test('when consumer throws error should return defected outcome', async () => {
        const consumer = vi.fn(() => {
          throw 'error occurred!';
        });
        const tapped = asyncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();

        await expectDefect(tapped, 'error occurred!');
        expect(consumer).toHaveBeenCalledOnce();
        expect(consumer).toHaveBeenCalledWith(42);
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      test('consumer should not be executed and same failed outcome returned', () => {
        const consumer = vi.fn((value) => 'tapped-' + value);
        const tapped = asyncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(consumer).not.toHaveBeenCalled();

        return expectFailure(tapped, 'ooups!');
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('consumer should not be executed and same defected outcome returned', () => {
        const consumer = vi.fn((value) => 'tapped-' + value);
        const tapped = asyncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(consumer).not.toHaveBeenCalled();

        return expectDefect(tapped, 'bug!');
      });
    });
  });

  describe('mapFailure', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      test('error transformer should not be executed and same succeeded outcome returned', () => {
        const errorTransformer = vi.fn((error) => 'transformed-' + error);
        const mapped = asyncOutcome.mapFailure(errorTransformer);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(errorTransformer).not.toHaveBeenCalled();

        return expectSuccess<number>(mapped, 42);
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      test('when error transformer succeeds should return the outcome with transformed failure', () => {
        const mapped = asyncOutcome.mapFailure((error) => 'transformed-' + error);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<number, string>>();

        return expectFailure<string>(mapped, 'transformed-ooups!');
      });

      test('when error transformer throws error should return defected outcome', () => {
        const mapped = asyncOutcome.mapFailure((): string => {
          throw 'error occurred!';
        });

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<number, string>>();

        return expectDefect(mapped, 'error occurred!');
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('error transformer should not be executed and same defected outcome returned', () => {
        const errorTransformer = vi.fn((error) => 'transformed-' + error);
        const mapped = asyncOutcome.mapFailure(errorTransformer);

        expect(mapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(errorTransformer).not.toHaveBeenCalled();

        return expectDefect(mapped, 'bug!');
      });
    });
  });

  describe('tapFailure', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      test('error consumer should not be executed and same succeeded outcome returned', () => {
        const errorConsumer = vi.fn((error) => 'consumed-' + error);
        const tapped = asyncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(errorConsumer).not.toHaveBeenCalled();

        return expectSuccess<number>(tapped, 42);
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      test('when error consumer succeeds should return the same failed outcome', async () => {
        const errorConsumer = vi.fn((error) => 'consumed-' + error);
        const tapped = asyncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();

        await expectFailure<string>(tapped, 'ooups!');
        expect(errorConsumer).toHaveBeenCalledOnce();
        expect(errorConsumer).toHaveBeenCalledWith('ooups!');
      });

      test('when error consumer throws error should return defected outcome', () => {
        const tapped = asyncOutcome.tapFailure(() => {
          throw 'error occurred!';
        });

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();

        return expectDefect(tapped, 'error occurred!');
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('error consumer should not be executed and same defected outcome returned', () => {
        const errorConsumer = vi.fn((error) => 'consumed-' + error);
        const tapped = asyncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(errorConsumer).not.toHaveBeenCalled();

        return expectDefect(tapped, 'bug!');
      });
    });
  });

  describe('recover', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      test('recoverer should not be executed and same succeeded outcome returned', () => {
        const recoverer = vi.fn((_error: string, _suppressed: string[]) => 100);
        const recovered = asyncOutcome.recover(recoverer);

        expect(recovered).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, never>>();
        expect(recoverer).not.toHaveBeenCalled();

        return expectSuccess<number>(recovered, 42);
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      describe('when recoverer function returns a non-outcome result', () => {
        test('should return succeeded outcome with a new result', async () => {
          const recoverer = vi.fn((_error: string, _suppressed: string[]) => 100);
          const recovered = asyncOutcome.recover(recoverer);

          expect(recovered).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, never>>();

          await expectSuccess<number>(recovered, 100);
          expect(recoverer).toHaveBeenCalledOnce();
          expect(recoverer).toHaveBeenCalledWith('ooups!', []);
        });
      });

      describe('when recoverer function returns a outcome result', () => {
        describe('when returned outcome is succeeded', () => {
          test('should return succeeded outcome', async () => {
            const recoverer = vi.fn((_error: string, _suppressed: string[]) => succeeded(200));
            const recovered = asyncOutcome.recover(recoverer);

            expect(recovered).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectSuccess<number>(recovered, 200);
            expect(recoverer).toHaveBeenCalledOnce();
            expect(recoverer).toHaveBeenCalledWith('ooups!', []);
          });
        });

        describe('when returned outcome is failed', () => {
          test('should return failed outcome', async () => {
            const recoverer = vi.fn((_error: string, _suppressed: string[]) =>
              failed('recovery failed'),
            );
            const recovered = asyncOutcome.recover(recoverer);

            expect(recovered).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectFailure<string>(recovered, 'recovery failed');
            expect(recoverer).toHaveBeenCalledOnce();
            expect(recoverer).toHaveBeenCalledWith('ooups!', []);
          });
        });

        describe('when returned outcome is defected', () => {
          test('should return defected outcome', async () => {
            const recoverer = vi.fn((_error: string, _suppressed: string[]) =>
              defected('recovery defect'),
            );
            const recovered = asyncOutcome.recover(recoverer);

            expect(recovered).toBeInstanceOf(AsyncOutcome);
            expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, string>>();

            await expectDefect(recovered, 'recovery defect');
            expect(recoverer).toHaveBeenCalledOnce();
            expect(recoverer).toHaveBeenCalledWith('ooups!', []);
          });
        });
      });

      describe('when recoverer function throws error', () => {
        test('should return defected outcome', async () => {
          const recoverer = vi.fn((_error: string, _suppressed: string[]): number => {
            throw 'recoverer error!';
          });
          const recovered = asyncOutcome.recover(recoverer);

          expect(recovered).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, never>>();

          await expectDefect(recovered, 'recoverer error!');
          expect(recoverer).toHaveBeenCalledOnce();
          expect(recoverer).toHaveBeenCalledWith('ooups!', []);
        });
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('recoverer should not be executed and same defected outcome returned', () => {
        const recoverer = vi.fn((_error: string, _suppressed: string[]) => 100);
        const recovered = asyncOutcome.recover(recoverer);

        expect(recovered).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(recovered).toEqualTypeOf<AsyncOutcome<number, never>>();
        expect(recoverer).not.toHaveBeenCalled();

        return expectDefect(recovered, 'bug!');
      });
    });
  });

  describe('flatMap', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      describe('when returned outcome is succeeded', () => {
        test('should return a succeeded outcome with a new result', async () => {
          const operation = vi.fn((value: number) => succeeded(value * 2));
          const flatMapped = asyncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectSuccess<number>(flatMapped, 84);
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is failed', () => {
        test('should return a failed outcome with a new failure', async () => {
          const operation = vi.fn((_value: number) => failed('flatMap failed'));
          const flatMapped = asyncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectFailure<string>(flatMapped, 'flatMap failed');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is defected', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number) => defected('flatMap defect'));
          const flatMapped = asyncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(flatMapped, 'flatMap defect');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when operation throws error', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number): AsyncOutcome<number, string> => {
            throw 'operation error!';
          });
          const flatMapped = asyncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(flatMapped, 'operation error!');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      test('operation should not be executed and same failed outcome returned', () => {
        const operation = vi.fn((value: number) => succeeded(value * 2));
        const flatMapped = asyncOutcome.flatMap(operation);

        expect(flatMapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(flatMapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        return expectFailure<string>(flatMapped, 'ooups!');
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('operation should not be executed and same defected outcome returned', () => {
        const operation = vi.fn((value: number) => succeeded(value * 2));
        const flatMapped = asyncOutcome.flatMap(operation);

        expect(flatMapped).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(flatMapped).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        return expectDefect(flatMapped, 'bug!');
      });
    });
  });

  describe('through', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      describe('when returned outcome is succeeded', () => {
        test('should execute operation and return the previous succeeded outcome', async () => {
          const operation = vi.fn((_value: number) => succeeded(100));
          const throughed = asyncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectSuccess<number>(throughed, 42);
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is failed', () => {
        test('should return a failed outcome with a new failure', async () => {
          const operation = vi.fn((_value: number) => failed('through failed'));
          const throughed = asyncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectFailure<string>(throughed, 'through failed');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is defected', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number) => defected('through defect'));
          const throughed = asyncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(throughed, 'through defect');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when operation throws error', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number): AsyncOutcome<string, string> => {
            throw 'operation error!';
          });
          const throughed = asyncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(throughed, 'operation error!');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      test('operation should not be executed and same failed outcome returned', () => {
        const operation = vi.fn((_value: number) => succeeded(100));
        const throughed = asyncOutcome.through(operation);

        expect(throughed).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(throughed).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        return expectFailure<string>(throughed, 'ooups!');
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('operation should not be executed and same defected outcome returned', () => {
        const operation = vi.fn((_value: number) => succeeded(100));
        const throughed = asyncOutcome.through(operation);

        expect(throughed).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(throughed).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        return expectDefect(throughed, 'bug!');
      });
    });
  });

  describe('finally', () => {
    let asyncOutcome: AsyncOutcome<number, string>;

    describe('when async outcome is succeeded', () => {
      beforeEach(() => {
        asyncOutcome = succeeded();
      });

      describe('when finalization returns succeeded outcome', () => {
        test('should return the previous succeeded outcome', async () => {
          const finalization = vi.fn(() => succeeded(999));
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          // Should preserve original value (42), not finalization result (999)
          await expectSuccess<number>(finalized, 42);
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns failed outcome', () => {
        test('should return a failed outcome with a new failure', async () => {
          const finalization = vi.fn(() => failed('finalization failed'));
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectFailure<string>(finalized, 'finalization failed');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns defected outcome', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn(() => defected('finalization defect'));
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization defect');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization throws error', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn((): AsyncOutcome<number, string> => {
            throw 'finalization error!';
          });
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization error!');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });
    });

    describe('when async outcome is failed', () => {
      beforeEach(() => {
        asyncOutcome = failed();
      });

      describe('when finalization returns succeeded outcome', () => {
        test('should return the previous failed outcome', async () => {
          const finalization = vi.fn(() => succeeded(999));
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          // Should preserve original failure, ignore finalization success
          await expectFailure<string>(finalized, 'ooups!');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns failed outcome', () => {
        test('should return the previous failed outcome with a new failure as suppressed', async () => {
          const finalization = vi.fn(() => failed('finalization failed'));
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          // Should return original failure, with finalization failure as suppressed
          await expectFailure<string>(finalized, 'ooups!', ['finalization failed']);
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns defected outcome', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn(() => defected('finalization defect'));
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization defect');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization throws error', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn((): AsyncOutcome<number, string> => {
            throw 'finalization error!';
          });
          const finalized = asyncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(AsyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization error!');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });
    });

    describe('when async outcome is defected', () => {
      beforeEach(() => {
        asyncOutcome = defected();
      });

      test('finalization should not be executed and same defected outcome returned', () => {
        const finalization = vi.fn(() => succeeded(999));
        const finalized = asyncOutcome.finally(finalization);

        expect(finalized).toBeInstanceOf(AsyncOutcome);
        expectTypeOf(finalized).toEqualTypeOf<AsyncOutcome<number, string>>();
        expect(finalization).not.toHaveBeenCalled();

        return expectDefect(finalized, 'bug!');
      });
    });
  });

  describe('sync', () => {
    describe('when async outcome is succeeded', () => {
      test('should return succeeded SyncOutcome', async () => {
        const asyncOutcome = succeeded();
        const syncOutcome = await asyncOutcome.sync();

        expect(syncOutcome).toBeInstanceOf(SyncOutcome);
        expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<number, string>>();

        return expectSuccess<number>(syncOutcome, 42);
      });
    });

    describe('when async outcome is failed', () => {
      test('should return failed SyncOutcome', async () => {
        const asyncOutcome = failed();
        const syncOutcome = await asyncOutcome.sync();

        expect(syncOutcome).toBeInstanceOf(SyncOutcome);
        expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<number, string>>();

        return expectFailure<string>(syncOutcome, 'ooups!');
      });
    });

    describe('when async outcome is defected', () => {
      test('should return defected SyncOutcome', async () => {
        const asyncOutcome = defected();
        const syncOutcome = await asyncOutcome.sync();

        expect(syncOutcome).toBeInstanceOf(SyncOutcome);
        expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<number, string>>();

        return expectDefect(syncOutcome, 'bug!');
      });
    });
  });
});

function succeeded(result: number = 42): AsyncOutcome<number, string> {
  return AsyncOutcome.fromCallback<number, string>((onSuccess) => {
    onSuccess(result);
  });
}

function failed(failure: string = 'ooups!'): AsyncOutcome<number, string> {
  return AsyncOutcome.fromCallback<number, string>((_onSuccess, onFailure) => {
    onFailure(failure);
  });
}

function defected(defect: string = 'bug!'): AsyncOutcome<number, string> {
  return AsyncOutcome.fromCallback<number, string>(() => {
    throw defect;
  });
}
