import { expect, test } from 'vitest';
import { Positive } from '../../../../../src';

const positive = new Positive();

test.each([
  { input: 0, valid: false },
  { input: 42, valid: true },
  { input: -6, valid: false },
])('positive validation when input is $input', ({ input, valid }) => {
  expect(positive.validate(input).isValid).toBe(valid);
});
