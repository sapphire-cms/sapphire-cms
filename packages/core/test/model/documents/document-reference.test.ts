import { expect, test } from 'vitest';
import { DocumentReference, refValidator } from '../../../src';

test.each([
  { input: '', valid: false },
  { input: '   ', valid: false },
  { input: '  _r2d2 ', valid: false },
  { input: '  2r2d2 ', valid: false },
  { input: '  docs ', valid: true },
  { input: '  docs:ru ', valid: true },
  { input: '  docs/ ', valid: false },
  { input: '  docs/lovely_doc-4238 ', valid: true },
  { input: '  docs/lovely_doc-4238:ru ', valid: true },
  { input: '  docs/path/to/lovely_doc-4238 ', valid: true },
  { input: '  docs/path/to/lovely_doc-4238:ru ', valid: true },
])('refValidator - $input', ({ input, valid }) => {
  expect(refValidator(input).isValid).toBe(valid);
});

test.each([
  { store: 'docs', path: [], docId: undefined, variant: undefined, expected: 'docs' },
  { store: 'docs', path: [], docId: undefined, variant: 'ru', expected: 'docs:ru' },
  { store: 'docs', path: [], docId: 'intro', variant: undefined, expected: 'docs/intro' },
  { store: 'docs', path: [], docId: 'intro', variant: 'ru', expected: 'docs/intro:ru' },
  {
    store: 'docs',
    path: ['content', 'types'],
    docId: 'reference',
    variant: undefined,
    expected: 'docs/content/types/reference',
  },
  {
    store: 'docs',
    path: ['content', 'types'],
    docId: 'reference',
    variant: 'ru',
    expected: 'docs/content/types/reference:ru',
  },
])('toString', ({ store, path, docId, variant, expected }) => {
  const docRef = new DocumentReference(store, path, docId, variant);
  const refStr = docRef.toString();
  expect(refStr).toBe(expected);
  expect(refValidator(refStr).isValid).toBe(true);
});

test.each([
  { input: 'docs/intro', store: 'docs', path: [], docId: 'intro', variant: undefined },
  { input: 'docs/intro:ru', store: 'docs', path: [], docId: 'intro', variant: 'ru' },
  {
    input: 'docs/content/types/reference',
    store: 'docs',
    path: ['content', 'types'],
    docId: 'reference',
    variant: undefined,
  },
  {
    input: 'docs/content/types/reference:ru',
    store: 'docs',
    path: ['content', 'types'],
    docId: 'reference',
    variant: 'ru',
  },
])('parse', ({ input, store, path, docId, variant }) => {
  const expected = new DocumentReference(store, path, docId, variant);
  const parsed = DocumentReference.parse(input);
  expect(parsed).toStrictEqual(expected);
});
