import { beforeEach, describe, expect, expectTypeOf, test, vi } from 'vitest';
import { expectDefect, expectFailure, expectSuccess } from './test-utils';
import { _defect, AsyncOutcome, failure, success, SyncOutcome, Outcome } from '../src';

describe('SyncOutcome', () => {
  describe('success', () => {
    test('create empty', () => {
      const syncOutcome = success();

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<void, never>>();

      return expectSuccess<void>(syncOutcome, undefined);
    });

    test('create from value', () => {
      const syncOutcome = success(42);

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<number, never>>();

      return expectSuccess<number>(syncOutcome, 42);
    });
  });

  describe('failure', () => {
    test('create empty', () => {
      const syncOutcome = failure();

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<never, void>>();

      return expectFailure<void>(syncOutcome, undefined);
    });

    test('create from value', () => {
      const syncOutcome = failure('ooups!');

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toEqualTypeOf<SyncOutcome<never, string>>();

      return expectFailure<string>(syncOutcome, 'ooups!');
    });
  });

  describe('all', () => {
    test('when all successful', () => {
      const syncOutcome = SyncOutcome.all([
        success(1),
        success(2),
        success(3),
        success(4),
        success(5),
      ]);

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toExtend<SyncOutcome<number[], undefined[]>>();

      return expectSuccess<number[]>(syncOutcome, [1, 2, 3, 4, 5]);
    });

    test('when some failed', () => {
      const syncOutcome = SyncOutcome.all([
        success(1),
        failure('fail 1'),
        success(3),
        failure('fail 2'),
        success(5),
      ]);

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toExtend<SyncOutcome<number[], (string | undefined)[]>>();

      return expectFailure<(string | undefined)[]>(syncOutcome, [
        undefined,
        'fail 1',
        undefined,
        'fail 2',
        undefined,
      ]);
    });

    test('when some defected', () => {
      const syncOutcome = SyncOutcome.all([
        success(1),
        failure('fail 1'),
        success(3),
        SyncOutcome[_defect]<number, string>('bug!'),
        success(5),
      ]);

      expect(syncOutcome).toBeInstanceOf(SyncOutcome);
      expectTypeOf(syncOutcome).toExtend<SyncOutcome<number[], (string | undefined)[]>>();

      return expectDefect(syncOutcome, 'bug!');
    });
  });

  describe('map', () => {
    let syncOutcome: SyncOutcome<number, string>;

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      test('when transformation succeeds should return outcome with transformed result', async () => {
        const transformation = vi.fn((value) => 'mapped-' + value);
        const mapped = syncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<string, string>>();

        await expectSuccess<string>(mapped, 'mapped-42');
        expect(transformation).toHaveBeenCalledOnce();
        expect(transformation).toHaveBeenCalledWith(42);
      });

      test('when transformation throws error should return defected outcome', async () => {
        const transformation = vi.fn((): string => {
          throw 'error occurred!';
        });
        const mapped = syncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<string, string>>();

        await expectDefect(mapped, 'error occurred!');
        expect(transformation).toHaveBeenCalledOnce();
        expect(transformation).toHaveBeenCalledWith(42);
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      test('transformation should not be executed and same failed outcome returned', async () => {
        const transformation = vi.fn((value) => 'mapped-' + value);
        const mapped = syncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<string, string>>();

        await expectFailure(mapped, 'ooups!');
        expect(transformation).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('transformation should not be executed and same defected outcome returned', async () => {
        const transformation = vi.fn((value) => 'mapped-' + value);
        const mapped = syncOutcome.map(transformation);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<string, string>>();

        await expectDefect(mapped, 'bug!');
        expect(transformation).not.toHaveBeenCalled();
      });
    });
  });

  describe('tap', () => {
    let syncOutcome: SyncOutcome<number, string>;

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      test('when consumer succeeds should return the same outcome', async () => {
        const consumer = vi.fn((value) => 'tapped-' + value);
        const tapped = syncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectSuccess<number>(tapped, 42);
        expect(consumer).toHaveBeenCalledOnce();
        expect(consumer).toHaveBeenCalledWith(42);
      });

      test('when consumer throws error should return defected outcome', async () => {
        const consumer = vi.fn(() => {
          throw 'error occurred!';
        });
        const tapped = syncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectDefect(tapped, 'error occurred!');
        expect(consumer).toHaveBeenCalledOnce();
        expect(consumer).toHaveBeenCalledWith(42);
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      test('consumer should not be executed and same failed outcome returned', async () => {
        const consumer = vi.fn((value) => 'tapped-' + value);
        const tapped = syncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectFailure(tapped, 'ooups!');
        expect(consumer).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('consumer should not be executed and same defected outcome returned', async () => {
        const consumer = vi.fn((value) => 'tapped-' + value);
        const tapped = syncOutcome.tap(consumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectDefect(tapped, 'bug!');
        expect(consumer).not.toHaveBeenCalled();
      });
    });
  });

  describe('mapFailure', () => {
    let syncOutcome: SyncOutcome<number, string>;

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      test('error transformer should not be executed and same succeeded outcome returned', async () => {
        const errorTransformer = vi.fn((error) => 'mapped-' + error);
        const mapped = syncOutcome.mapFailure(errorTransformer);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectSuccess<number>(mapped, 42);
        expect(errorTransformer).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      test('when error transformer succeeds should return the outcome with transformed failure', async () => {
        const errorTransformer = vi.fn((error) => 'mapped-' + error);
        const mapped = syncOutcome.mapFailure(errorTransformer);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectFailure<string>(mapped, 'mapped-ooups!');
        expect(errorTransformer).toHaveBeenCalledOnce();
        expect(errorTransformer).toHaveBeenCalledWith('ooups!');
      });

      test('when error transformer throws error should return defected outcome', async () => {
        const errorTransformer = vi.fn((): string => {
          throw 'error occurred!';
        });
        const mapped = syncOutcome.mapFailure(errorTransformer);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectDefect(mapped, 'error occurred!');
        expect(errorTransformer).toHaveBeenCalledOnce();
        expect(errorTransformer).toHaveBeenCalledWith('ooups!');
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('error transformer should not be executed and same defected outcome returned', async () => {
        const errorTransformer = vi.fn((error) => 'mapped-' + error);
        const mapped = syncOutcome.mapFailure(errorTransformer);

        expect(mapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(mapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectDefect(mapped, 'bug!');
        expect(errorTransformer).not.toHaveBeenCalled();
      });
    });
  });

  describe('tapFailure', () => {
    let syncOutcome: SyncOutcome<number, string>;

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      test('error consumer should not be executed and same succeeded outcome returned', async () => {
        const errorConsumer = vi.fn((error) => 'tapped-' + error);
        const tapped = syncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectSuccess<number>(tapped, 42);
        expect(errorConsumer).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      test('when error consumer succeeds should return the same failed outcome', async () => {
        const errorConsumer = vi.fn((error) => 'tapped-' + error);
        const tapped = syncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectFailure<string>(tapped, 'ooups!');
        expect(errorConsumer).toHaveBeenCalledOnce();
        expect(errorConsumer).toHaveBeenCalledWith('ooups!');
      });

      test('when error consumer throws error should return defected outcome', async () => {
        const errorConsumer = vi.fn(() => {
          throw 'error occurred!';
        });
        const tapped = syncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectDefect(tapped, 'error occurred!');
        expect(errorConsumer).toHaveBeenCalledOnce();
        expect(errorConsumer).toHaveBeenCalledWith('ooups!');
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('error consumer should not be executed and same defected outcome returned', async () => {
        const errorConsumer = vi.fn((error) => 'tapped-' + error);
        const tapped = syncOutcome.tapFailure(errorConsumer);

        expect(tapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(tapped).toEqualTypeOf<SyncOutcome<number, string>>();

        await expectDefect(tapped, 'bug!');
        expect(errorConsumer).not.toHaveBeenCalled();
      });
    });
  });

  describe('recover', () => {
    let syncOutcome: SyncOutcome<number, string>;

    test('overloaded methods signatures', () => {
      syncOutcome = failure('ooups!');

      // Recoverer returns plain object
      const recovered1 = syncOutcome.recover(() => 200);
      expect(recovered1).toBeInstanceOf(SyncOutcome);
      expectTypeOf(recovered1).toEqualTypeOf<SyncOutcome<number, never>>();

      // Recoverer returns Outcome
      const recovered2 = syncOutcome.recover(() => success(200) as Outcome<number, string>);
      expect(recovered2).toBeInstanceOf(SyncOutcome);
      expectTypeOf(recovered2).toEqualTypeOf<Outcome<number, string>>();

      // Recoverer returns SyncOutcome
      const recovered3 = syncOutcome.recover(() => success(200));
      expect(recovered3).toBeInstanceOf(SyncOutcome);
      expectTypeOf(recovered3).toEqualTypeOf<SyncOutcome<number, never>>();

      // Recoverer returns AsyncOutcome
      const recovered4 = syncOutcome.recover(() =>
        AsyncOutcome.fromCallback<number, string>((onSuccess) => {
          onSuccess(200);
        }),
      );
      expect(recovered4).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(recovered4).toEqualTypeOf<AsyncOutcome<number, string>>();
    });

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      test('recoverer should not be executed and same succeeded outcome returned', async () => {
        const recoverer = vi.fn(() => 200);
        const recovered = syncOutcome.recover(recoverer);

        expect(recovered).toBeInstanceOf(SyncOutcome);
        expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, never>>();

        await expectSuccess<number>(recovered, 42);
        expect(recoverer).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      describe('when recoverer function returns a non-outcome result', () => {
        test('should return succeeded outcome with a new result', async () => {
          const recoverer = vi.fn(() => 200);
          const recovered = syncOutcome.recover(recoverer);

          expect(recovered).toBeInstanceOf(SyncOutcome);
          expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, never>>();

          await expectSuccess<number>(recovered, 200);
          expect(recoverer).toHaveBeenCalledOnce();
          expect(recoverer).toHaveBeenCalledWith('ooups!', []);
        });
      });

      describe('when recoverer function returns a outcome result', () => {
        describe('when returned outcome is succeeded', () => {
          test('should return succeeded outcome', async () => {
            const recoverer = vi.fn(() => success(200));
            const recovered = syncOutcome.recover(recoverer);

            expect(recovered).toBeInstanceOf(SyncOutcome);
            expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, never>>();

            await expectSuccess<number>(recovered, 200);
            expect(recoverer).toHaveBeenCalledOnce();
            expect(recoverer).toHaveBeenCalledWith('ooups!', []);
          });
        });

        describe('when returned outcome is failed', () => {
          test('should return failed outcome', async () => {
            const recoverer = vi.fn((error) => failure('new-error-' + error));
            const recovered = syncOutcome.recover(recoverer);

            expect(recovered).toBeInstanceOf(SyncOutcome);
            expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, string>>();

            await expectFailure<string>(recovered, 'new-error-ooups!');
            expect(recoverer).toHaveBeenCalledOnce();
            expect(recoverer).toHaveBeenCalledWith('ooups!', []);
          });
        });

        describe('when returned outcome is defected', () => {
          test('should return defected outcome', async () => {
            const recoverer = vi.fn(
              (error) => SyncOutcome[_defect]('defect-' + error) as SyncOutcome<number, never>,
            );
            const recovered = syncOutcome.recover(recoverer);

            expect(recovered).toBeInstanceOf(SyncOutcome);
            expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, never>>();

            await expectDefect(recovered, 'defect-ooups!');
            expect(recoverer).toHaveBeenCalledOnce();
            expect(recoverer).toHaveBeenCalledWith('ooups!', []);
          });
        });
      });

      describe('when recoverer function throws error', () => {
        test('should return defected outcome', async () => {
          const recoverer = vi.fn((): number => {
            throw 'error occurred!';
            return 200; // to make compile pick the right overloaded signature
          });
          const recovered = syncOutcome.recover(recoverer);

          expect(recovered).toBeInstanceOf(SyncOutcome);
          expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, never>>();

          await expectDefect(recovered, 'error occurred!');
          expect(recoverer).toHaveBeenCalledOnce();
          expect(recoverer).toHaveBeenCalledWith('ooups!', []);
        });
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('recoverer should not be executed and same defected outcome returned', async () => {
        const recoverer = vi.fn(() => 200);
        const recovered = syncOutcome.recover(recoverer);

        expect(recovered).toBeInstanceOf(SyncOutcome);
        expectTypeOf(recovered).toEqualTypeOf<SyncOutcome<number, never>>();

        await expectDefect(recovered, 'bug!');
        expect(recoverer).not.toHaveBeenCalled();
      });
    });
  });

  describe('flatMap', () => {
    let syncOutcome: SyncOutcome<number, string>;

    test('overloaded methods signatures', () => {
      syncOutcome = success(42);

      // Operation returns Outcome
      const flatMapped1 = syncOutcome.flatMap(
        (value) => success('value-' + value) as Outcome<string, string>,
      );
      expect(flatMapped1).toBeInstanceOf(SyncOutcome);
      expectTypeOf(flatMapped1).toEqualTypeOf<Outcome<string, string>>();

      // Operation returns SyncOutcome
      const flatMapped2 = syncOutcome.flatMap((value) => success('value-' + value));
      expect(flatMapped2).toBeInstanceOf(SyncOutcome);
      expectTypeOf(flatMapped2).toEqualTypeOf<SyncOutcome<string, string>>();

      // Operation returns AsyncOutcome
      const flatMapped3 = syncOutcome.flatMap((value) =>
        AsyncOutcome.fromCallback<string, string>((onSuccess) => {
          onSuccess('value-' + value);
        }),
      );
      expect(flatMapped3).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(flatMapped3).toEqualTypeOf<AsyncOutcome<string, string>>();
    });

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      describe('when returned outcome is succeeded', () => {
        test('should return a succeeded outcome with a new result', async () => {
          const operation = vi.fn((value: number) => success(value * 2));
          const flatMapped = syncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(SyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectSuccess<number>(flatMapped, 84);
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is failed', () => {
        test('should return a failed outcome with a new failure', async () => {
          const operation = vi.fn(
            (_value: number) => failure('flatMap failed') as SyncOutcome<string, string>,
          );
          const flatMapped = syncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(SyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<SyncOutcome<string, string>>();

          await expectFailure<string>(flatMapped, 'flatMap failed');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is defected', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number) =>
            SyncOutcome[_defect]<number, string>('flatMap defect'),
          );
          const flatMapped = syncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(SyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(flatMapped, 'flatMap defect');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when operation throws error', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number): SyncOutcome<number, string> => {
            throw 'operation error!';
          });
          const flatMapped = syncOutcome.flatMap(operation);

          expect(flatMapped).toBeInstanceOf(SyncOutcome);
          expectTypeOf(flatMapped).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(flatMapped, 'operation error!');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      test('operation should not be executed and same failed outcome returned', async () => {
        const operation = vi.fn((value: number) => success(value * 2));
        const flatMapped = syncOutcome.flatMap(operation);

        expect(flatMapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(flatMapped).toEqualTypeOf<SyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        await expectFailure<string>(flatMapped, 'ooups!');
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('operation should not be executed and same defected outcome returned', async () => {
        const operation = vi.fn((value: number) => success(value * 2));
        const flatMapped = syncOutcome.flatMap(operation);

        expect(flatMapped).toBeInstanceOf(SyncOutcome);
        expectTypeOf(flatMapped).toEqualTypeOf<SyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        await expectDefect(flatMapped, 'bug!');
      });
    });
  });

  describe('through', () => {
    let syncOutcome: SyncOutcome<number, string>;

    test('overloaded methods signatures', () => {
      syncOutcome = success(42);

      // Operation returns Outcome
      const throughed1 = syncOutcome.through(
        (value) => success('value-' + value) as Outcome<string, string>,
      );
      expect(throughed1).toBeInstanceOf(SyncOutcome);
      expectTypeOf(throughed1).toEqualTypeOf<Outcome<number, string>>();

      // Operation returns SyncOutcome
      const throughed2 = syncOutcome.through((value) => success('value-' + value));
      expect(throughed2).toBeInstanceOf(SyncOutcome);
      expectTypeOf(throughed2).toEqualTypeOf<SyncOutcome<number, string>>();

      // Operation returns AsyncOutcome
      const throughed3 = syncOutcome.through((value) =>
        AsyncOutcome.fromCallback<string, string>((onSuccess) => {
          onSuccess('value-' + value);
        }),
      );
      expect(throughed3).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(throughed3).toEqualTypeOf<AsyncOutcome<number, string>>();
    });

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      describe('when returned outcome is succeeded', () => {
        test('should execute operation and return the previous succeeded outcome', async () => {
          const operation = vi.fn((value: number) => success('value-' + value));
          const throughed = syncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(SyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectSuccess<number>(throughed, 42);
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is failed', () => {
        test('should return a failed outcome with a new failure', async () => {
          const operation = vi.fn((_value: number) => failure('through failed'));
          const throughed = syncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(SyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectFailure<string>(throughed, 'through failed');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when returned outcome is defected', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number) =>
            SyncOutcome[_defect]<string, string>('through defect'),
          );
          const throughed = syncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(SyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(throughed, 'through defect');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });

      describe('when operation throws error', () => {
        test('should return defected outcome', async () => {
          const operation = vi.fn((_value: number): SyncOutcome<string, string> => {
            throw 'operation error!';
          });
          const throughed = syncOutcome.through(operation);

          expect(throughed).toBeInstanceOf(SyncOutcome);
          expectTypeOf(throughed).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(throughed, 'operation error!');
          expect(operation).toHaveBeenCalledOnce();
          expect(operation).toHaveBeenCalledWith(42);
        });
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      test('operation should not be executed and same failed outcome returned', async () => {
        const operation = vi.fn((value: number) => success('value-' + value));
        const throughed = syncOutcome.through(operation);

        expect(throughed).toBeInstanceOf(SyncOutcome);
        expectTypeOf(throughed).toEqualTypeOf<SyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        await expectFailure<string>(throughed, 'ooups!');
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('operation should not be executed and same defected outcome returned', async () => {
        const operation = vi.fn((value: number) => success('value-' + value));
        const throughed = syncOutcome.through(operation);

        expect(throughed).toBeInstanceOf(SyncOutcome);
        expectTypeOf(throughed).toEqualTypeOf<SyncOutcome<number, string>>();
        expect(operation).not.toHaveBeenCalled();

        await expectDefect(throughed, 'bug!');
      });
    });
  });

  describe('finally', () => {
    let syncOutcome: SyncOutcome<number, string>;

    test('overloaded methods signatures', () => {
      syncOutcome = success(42);

      // Finalization returns Outcome
      const finalized1 = syncOutcome.finally(() => success('value') as Outcome<string, string>);
      expect(finalized1).toBeInstanceOf(SyncOutcome);
      expectTypeOf(finalized1).toEqualTypeOf<Outcome<number, string>>();

      // Finalization returns SyncOutcome
      const finalized2 = syncOutcome.finally(() => success('value'));
      expect(finalized2).toBeInstanceOf(SyncOutcome);
      expectTypeOf(finalized2).toEqualTypeOf<SyncOutcome<number, string>>();

      // Finalization returns AsyncOutcome
      const finalized3 = syncOutcome.finally(() =>
        AsyncOutcome.fromCallback<string, string>((onSuccess) => {
          onSuccess('value');
        }),
      );
      expect(finalized3).toBeInstanceOf(AsyncOutcome);
      expectTypeOf(finalized3).toEqualTypeOf<AsyncOutcome<number, string>>();
    });

    describe('when sync outcome is succeeded', () => {
      beforeEach(() => {
        syncOutcome = success(42);
      });

      describe('when finalization returns succeeded outcome', () => {
        test('should return the previous succeeded outcome', async () => {
          const finalization = vi.fn(() => success(999));
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          // Should preserve original value (42), not finalization result (999)
          await expectSuccess<number>(finalized, 42);
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns failed outcome', () => {
        test('should return a failed outcome with a new failure', async () => {
          const finalization = vi.fn(() => failure('finalization failed'));
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectFailure<string>(finalized, 'finalization failed');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns defected outcome', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn(() =>
            SyncOutcome[_defect]<number, string>('finalization defect'),
          );
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization defect');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization throws error', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn((): SyncOutcome<number, string> => {
            throw 'finalization error!';
          });
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization error!');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });
    });

    describe('when sync outcome is failed', () => {
      beforeEach(() => {
        syncOutcome = failure('ooups!');
      });

      describe('when finalization returns succeeded outcome', () => {
        test('should return the previous failed outcome', async () => {
          const finalization = vi.fn(() => success(999));
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          // Should preserve original failure, ignore finalization success
          await expectFailure<string>(finalized, 'ooups!');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns failed outcome', () => {
        test('should return the previous failed outcome with a new failure as suppressed', async () => {
          const finalization = vi.fn(() => failure('finalization failed'));
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          // Should return original failure, with finalization failure as suppressed
          await expectFailure<string>(finalized, 'ooups!', ['finalization failed']);
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization returns defected outcome', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn(() =>
            SyncOutcome[_defect]<number, string>('finalization defect'),
          );
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization defect');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });

      describe('when finalization throws error', () => {
        test('should return defected outcome', async () => {
          const finalization = vi.fn((): SyncOutcome<number, string> => {
            throw 'finalization error!';
          });
          const finalized = syncOutcome.finally(finalization);

          expect(finalized).toBeInstanceOf(SyncOutcome);
          expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();

          await expectDefect(finalized, 'finalization error!');
          expect(finalization).toHaveBeenCalledOnce();
        });
      });
    });

    describe('when sync outcome is defected', () => {
      beforeEach(() => {
        syncOutcome = SyncOutcome[_defect]<number, string>('bug!');
      });

      test('finalization should not be executed and same defected outcome returned', async () => {
        const finalization = vi.fn(() => success(999));
        const finalized = syncOutcome.finally(finalization);

        expect(finalized).toBeInstanceOf(SyncOutcome);
        expectTypeOf(finalized).toEqualTypeOf<SyncOutcome<number, string>>();
        expect(finalization).not.toHaveBeenCalled();

        await expectDefect(finalized, 'bug!');
      });
    });
  });

  describe('matchSync', () => {
    let onSuccess: (result: number) => void;
    let onFailure: (main: string, suppressed: string[]) => void;
    let onDefect: (cause: unknown) => void;

    beforeEach(() => {
      onSuccess = vi.fn();
      onFailure = vi.fn();
      onDefect = vi.fn();
    });

    describe('when sync outcome is succeeded', () => {
      test('should call success handler', () => {
        const syncOutcome = success(42);

        syncOutcome.matchSync(onSuccess, onFailure, onDefect);

        expect(onSuccess).toHaveBeenCalledOnce();
        expect(onSuccess).toHaveBeenCalledWith(42);
        expect(onFailure).not.toHaveBeenCalled();
        expect(onDefect).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is failed', () => {
      test('should call fail handler', () => {
        const syncOutcome = failure('ooups!');

        syncOutcome.matchSync(onSuccess, onFailure, onDefect);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledOnce();
        expect(onFailure).toHaveBeenCalledWith('ooups!', []);
        expect(onDefect).not.toHaveBeenCalled();
      });

      test('should call fail handler with suppressed failures', () => {
        // Create a failed outcome with suppressed failures (from finally chain)
        const syncOutcome = failure('main error').finally(() => failure('suppressed error'));

        syncOutcome.matchSync(onSuccess, onFailure, onDefect);

        expect(onSuccess).not.toHaveBeenCalled();
        expect(onFailure).toHaveBeenCalledOnce();
        expect(onFailure).toHaveBeenCalledWith('main error', ['suppressed error']);
        expect(onDefect).not.toHaveBeenCalled();
      });
    });

    describe('when sync outcome is defected', () => {
      describe('when defect handler is provided', () => {
        test('should call defect handler', () => {
          const syncOutcome = SyncOutcome[_defect]<number, string>('bug!');

          syncOutcome.matchSync(onSuccess, onFailure, onDefect);

          expect(onSuccess).not.toHaveBeenCalled();
          expect(onFailure).not.toHaveBeenCalled();
          expect(onDefect).toHaveBeenCalledOnce();
          expect(onDefect).toHaveBeenCalledWith('bug!');
        });
      });

      describe('when defect handler is not provided', () => {
        test('should throw an exception', () => {
          const syncOutcome = SyncOutcome[_defect]<number, string>('bug!');

          expect(() => {
            syncOutcome.matchSync(onSuccess, onFailure);
          }).toThrow('bug!');

          expect(onSuccess).not.toHaveBeenCalled();
          expect(onFailure).not.toHaveBeenCalled();
          expect(onDefect).not.toHaveBeenCalled();
        });
      });
    });
  });
});
