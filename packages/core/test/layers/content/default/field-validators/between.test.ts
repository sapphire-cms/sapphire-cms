import { expect, test } from 'vitest';
import { Between } from '../../../../../src';

const between = new Between({ min: 6, max: 10 });

test.each([
  { input: 0, valid: false },
  { input: 42, valid: false },
  { input: 6, valid: true },
  { input: 8, valid: true },
  { input: 10, valid: true },
])('between validation when input is $input', ({ input, valid }) => {
  expect(between.validate(input).isValid).toBe(valid);
});
