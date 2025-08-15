import { Outcome } from '../src';
import { expect } from 'vitest';

export function expectSuccess<T>(outcome: Outcome<T, unknown>, expectedResult: T): Promise<void> {
  return outcome.match(
    (result) => {
      expect(result).toStrictEqual(expectedResult);
    },
    (err) => {
      const msg = 'Unexpected failure:\n' + JSON.stringify(err);
      throw new Error(msg);
    },
    (defect) => {
      const msg = 'Unexpected defect:\n' + JSON.stringify(defect);
      throw new Error(msg);
    },
  );
}

export function expectFailure<F>(
  outcome: Outcome<unknown, F>,
  expectedFailure: F,
  expectedSuppressed: F[] = [],
): Promise<void> {
  return outcome.match(
    (result) => {
      const msg = 'Unexpected success:\n' + JSON.stringify(result);
      throw new Error(msg);
    },
    (err, suppressed) => {
      expect(err).toStrictEqual(expectedFailure);
      expect(suppressed).toStrictEqual(expectedSuppressed);
    },
    (defect) => {
      const msg = 'Unexpected defect:\n' + JSON.stringify(defect);
      throw new Error(msg);
    },
  );
}

export function expectDefect<D>(
  outcome: Outcome<unknown, unknown>,
  expectedDefect: D,
): Promise<void> {
  return outcome.match(
    (result) => {
      const msg = 'Unexpected success:\n' + JSON.stringify(result);
      throw new Error(msg);
    },
    (err) => {
      const msg = 'Unexpected failure:\n' + JSON.stringify(err);
      throw new Error(msg);
    },
    (defect) => {
      expect(defect).toStrictEqual(expectedDefect);
    },
  );
}
