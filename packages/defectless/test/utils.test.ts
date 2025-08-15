import { describe, test, expect } from 'vitest';
import { isPromiseLike } from '../src/utils';

describe('isPromiseLike', () => {
  test.each([
    { value: Promise.resolve(42), expected: true, description: 'a real Promise' },
    { value: { then: () => {} }, expected: true, description: 'a thenable object' },
    { value: 42, expected: false, description: 'a primitive number' },
    { value: null, expected: false, description: 'null' },
    { value: undefined, expected: false, description: 'undefined' },
  ])('should return $expected for $description', ({ value, expected }) => {
    expect(isPromiseLike(value)).toBe(expected);
  });
});
