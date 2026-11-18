import { expect, test } from 'vitest';
import { DEFAULT_MODULE_REF, FieldTypeFactory, Reference } from '../../../../../src';
import { SapphireFieldTypeClass } from '../../../../../src/layers/content/fields-typing.types';

const referenceType = new FieldTypeFactory(
  DEFAULT_MODULE_REF,
  Reference as unknown as SapphireFieldTypeClass,
).instance({
  store: 'docs',
});

test('example should be valid', () => {
  expect(referenceType.validate(referenceType.example!).isValid).toBe(true);
});

test.each([
  { input: '  clients/path/to/lovely_doc-4238:ru ', valid: false },
  { input: '  docs/path/to/lovely_doc-4238:ru ', valid: true },
])('reference type validation - $input', ({ input, valid }) => {
  expect(referenceType.validate(input).isValid).toBe(valid);
});
