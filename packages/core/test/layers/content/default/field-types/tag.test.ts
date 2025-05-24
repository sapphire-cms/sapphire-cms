import { Tag } from '../../../../../src';
import { test, expect } from 'vitest';

const tagNoMultiple = new Tag({
  multiple: false,
  values: ['sponsor', 'partner', 'founding partner'],
});
const tagMultiple = new Tag({ multiple: true, values: ['sponsor', 'partner', 'founding partner'] });

test.each([
  { input: '', valid: true },
  { input: '   ', valid: false },
  { input: ' partner  ', valid: false },
  { input: ' #zod  ', valid: false },
  { input: ' #partner  ', valid: true },
  { input: ' #partner#sponsor  ', valid: false },
  { input: ' #founding partner  ', valid: true },
  { input: ' #partner #founding partner  ', valid: false },
])('id type validation when multiple tags forbidden - $input', ({ input, valid }) => {
  expect(tagNoMultiple.validate(input).isValid).toBe(valid);
});

test.each([
  { input: '', valid: true },
  { input: '   ', valid: false },
  { input: ' partner  ', valid: false },
  { input: ' #zod  ', valid: false },
  { input: ' #partner  ', valid: true },
  { input: ' #partner#sponsor  ', valid: true },
  { input: ' #founding partner  ', valid: true },
  { input: ' #partner #founding partner  ', valid: true },
  { input: ' #partner #zod  ', valid: false },
])('id type validation when multiple tags authorized - $input', ({ input, valid }) => {
  expect(tagMultiple.validate(input).isValid).toBe(valid);
});
