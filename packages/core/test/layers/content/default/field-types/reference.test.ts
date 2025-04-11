import {expect, test} from 'vitest';
import {
  createReferenceString,
  getFieldTypeMetadataFromClass,
  Id,
  parseReferenceString,
  Reference
} from '../../../../../src';

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

test.each([
  { store: 'docs', path: [], docId: 'intro', variant: undefined, expected: 'docs:intro' },
  { store: 'docs', path: [], docId: 'intro', variant: 'ru', expected: 'docs:intro:ru' },
  { store: 'docs', path: [ 'content', 'types' ], docId: 'reference', variant: undefined, expected: 'docs:content/types/reference' },
  { store: 'docs', path: [ 'content', 'types' ], docId: 'reference', variant: 'ru', expected: 'docs:content/types/reference:ru' },
])('createReferenceString', ({ store, path, docId, variant, expected }) => {
  const ref = createReferenceString(store, path, docId, variant);
  expect(ref).toBe(expected);
  expect(referenceType.validate(ref).isValid).toBe(true);
});

test.each([
  { input: 'docs:intro', store: 'docs', path: [], docId: 'intro', variant: undefined },
  { input: 'docs:intro:ru', store: 'docs', path: [], docId: 'intro', variant: 'ru' },
  { input: 'docs:content/types/reference', store: 'docs', path: [ 'content', 'types' ], docId: 'reference', variant: undefined },
  { input: 'docs:content/types/reference:ru', store: 'docs', path: [ 'content', 'types' ], docId: 'reference', variant: 'ru' },
])('parseReferenceString', ({ input, store, path, docId, variant }) => {
  const refObj = parseReferenceString(input);
  expect(refObj).toStrictEqual({ store, path, docId, variant });
});
