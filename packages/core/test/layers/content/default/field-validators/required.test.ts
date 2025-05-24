import { test, expect } from 'vitest';
import { Required } from '../../../../../src';

const required = new Required();

test.each([
  { input: null, valid: false },
  { input: '', valid: false },
  { input: '    ', valid: false },
  { input: 0, valid: true },
  { input: 42, valid: true },
  { input: false, valid: true },
  { input: true, valid: true },
  { input: 'A quick brown fox', valid: true },
])('required validation when input is $input', ({ input, valid }) => {
  expect(required.validate(input).isValid).toBe(valid);
});
