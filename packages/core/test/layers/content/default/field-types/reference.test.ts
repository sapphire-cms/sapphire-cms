import {expect, test} from 'vitest';
import {FieldTypeFactory, Reference} from '../../../../../src';

const referenceType = new FieldTypeFactory(Reference).instance({ store: 'docs' });

test('example should be valid', () => {
  expect(referenceType.validate(referenceType.example).isValid).toBe(true);
});

test.each([
  { input: '  clients/path/to/lovely_doc-4238:ru ', valid: false },
  { input: '  docs/path/to/lovely_doc-4238:ru ', valid: true },
])('reference type validation - $input', ({ input, valid }) => {
  expect(referenceType.validate(input).isValid).toBe(valid);
});
