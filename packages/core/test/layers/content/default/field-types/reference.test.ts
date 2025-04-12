import {expect, test} from 'vitest';
import {getFieldTypeMetadataFromClass, Reference} from '../../../../../src';

const referenceType = new Reference({ store: 'docs' });

test('example should be valid', () => {
  const meta = getFieldTypeMetadataFromClass(Reference);
  const example = meta?.example;
  expect(referenceType.validate(example).isValid).toBe(true);
});

test.each([
  { input: '  clients/path/to/lovely_doc-4238:ru ', valid: false },
  { input: '  docs/path/to/lovely_doc-4238:ru ', valid: true },
])('reference type validation - $input', ({ input, valid }) => {
  expect(referenceType.validate(input).isValid).toBe(valid);
});
