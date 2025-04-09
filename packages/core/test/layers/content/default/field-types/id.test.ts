import {expect, test} from 'vitest';
import {getFieldTypeMetadataFromClass, Id} from '../../../../../src';

const idType = new Id();

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
])('id type validation - $input', ({ input, valid }) => {
  expect(idType.validate(input).isValid).toBe(valid);
});

test('example should be valid', () => {
  const meta = getFieldTypeMetadataFromClass(Id);
  const example = meta?.example;
  expect(idType.validate(example).isValid).toBe(true);
});
