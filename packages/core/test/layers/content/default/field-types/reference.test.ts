import {expect, test} from 'vitest';
import {getFieldTypeMetadataFromClass, Id, Reference} from '../../../../../src';

const referenceType = new Reference({ store: 'docs' });

test.each([
  { input: '', valid: false },
  { input: '   ', valid: false },
  { input: '  _r2d2 ', valid: false },
  { input: '  2r2d2 ', valid: false },
  { input: '  docs ', valid: false },
  { input: '  docs: ', valid: false },
  { input: '  docs:lovely_doc-4238 ', valid: true },
  { input: '  docs:lovely_doc-4238:ru ', valid: true },
  { input: '  docs:path/to/lovely_doc-4238 ', valid: true },
  { input: '  docs:path/to/lovely_doc-4238:ru ', valid: true },
])('reference type validation - $input', ({ input, valid }) => {
  expect(referenceType.validate(input).isValid).toBe(valid);
});

test('example should be valid', () => {
  const meta = getFieldTypeMetadataFromClass(Reference);
  const example = meta?.example;
  expect(referenceType.validate(example).isValid).toBe(true);
});
