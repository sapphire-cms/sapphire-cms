import { expect, test } from 'vitest';
import { generateId, idValidator } from '../../src';

test('generateId', () => {
  const id = generateId('sapphire');
  expect(id.startsWith('sapphire')).toBe(true);
  expect(id.endsWith('i')).toBe(true);
  expect(idValidator(id).isValid).toBe(true);
});

test.each([
  { input: '', valid: false },
  { input: '   ', valid: false },
  { input: '_r2d2', valid: false },
  { input: '2r2d2', valid: false },
  { input: '-r2d2', valid: false },
  { input: '-r2d2', valid: false },
  { input: 'r2d2_', valid: false },
  { input: 'r2d2', valid: true },
  { input: 'lovely_doc-4238', valid: true },
])('idValidator - $input', ({ input, valid }) => {
  expect(idValidator(input).isValid).toBe(valid);
});
