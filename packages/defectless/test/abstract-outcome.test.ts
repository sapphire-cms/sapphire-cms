import { describe, test, beforeEach, vi, expect } from 'vitest';
import { _defect, SyncOutcome, failure, success } from '../src';
import { AbstractOutcome } from '../src/abstract-outcome';

describe('AbstractOutcome', () => {
  describe('match', () => {
    let outcome: AbstractOutcome<number, string>;
    let onSuccess: (result: number) => void;
    let onFailure: (main: string, suppressed: string[]) => void;
    let onDefect: (cause: unknown) => void;

    beforeEach(() => {
      onSuccess = vi.fn();
      onFailure = vi.fn();
      onDefect = vi.fn();
    });

    test('when async outcome is succeeded', async () => {
      outcome = success(42);

      await outcome.match(onSuccess, onFailure, onDefect);

      expect(onSuccess).toHaveBeenCalledOnce();
      expect(onSuccess).toHaveBeenCalledWith(42);
      expect(onFailure).not.toHaveBeenCalled();
      expect(onDefect).not.toHaveBeenCalled();
    });

    test('when async outcome is failed', async () => {
      outcome = failure('ooups!');

      await outcome.match(onSuccess, onFailure, onDefect);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).toHaveBeenCalledOnce();
      expect(onFailure).toHaveBeenCalledWith('ooups!', []);
      expect(onDefect).not.toHaveBeenCalled();
    });

    test('when async outcome is defected and defect handler is provided', async () => {
      outcome = SyncOutcome[_defect]<number, string>('bug!');

      await outcome.match(onSuccess, onFailure, onDefect);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
      expect(onDefect).toHaveBeenCalledOnce();
      expect(onDefect).toHaveBeenCalledWith('bug!');
    });

    test('when async outcome is defected and defect handler is missing', async () => {
      outcome = SyncOutcome[_defect]<number, string>('bug!');

      const invocation = async () => {
        await outcome.match(onSuccess, onFailure);
      };

      await expect(invocation()).rejects.toThrow('bug!');

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onFailure).not.toHaveBeenCalled();
    });
  });
});
