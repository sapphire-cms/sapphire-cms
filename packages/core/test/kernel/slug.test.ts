import { expect, test } from 'vitest';
import { slugValidator } from '../../src';

test.each([
  { input: '', valid: false },
  { input: '/', valid: false },
  { input: '@', valid: false },
  { input: '@codegen/kotlin', valid: false },
  { input: 'image', valid: true },
  { input: 'media/folder/image', valid: true },
  { input: 'media/folder/image.jpg', valid: false },
])('Validation when input is $input', ({ input, valid }) => {
  expect(slugValidator(input).isValid).toBe(valid);
});
