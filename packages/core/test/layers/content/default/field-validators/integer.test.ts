import {expect, test} from 'vitest';
import {Integer} from '../../../../../src';

const integer = new Integer();

test.each([
  { input: NaN, valid: false },
  { input: 0, valid: true },
  { input: 0.0, valid: true },
  { input: 14.88, valid: false },
])('integer validation when input is $input', ({ input, valid }) => {
  expect(integer.validate(input).isValid).toBe(valid);
});
