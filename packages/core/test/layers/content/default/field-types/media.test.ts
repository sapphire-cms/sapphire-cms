import { expect, test } from 'vitest';
import { Media } from '../../../../../src';

const mediaType = new Media();

test.each([
  { input: '  cms-media/lovely_doc-4238 ', valid: true },
  { input: '  cms-media/path/to/lovely_doc-4238 ', valid: true },
  { input: '  media/lovely_doc-4238 ', valid: false },
  { input: '  media ', valid: false },
])('media type validation - $input', ({ input, valid }) => {
  expect(mediaType.validate(input).isValid).toBe(valid);
});
