import {expect, test} from 'vitest';
import {Group} from '../../../../../src';

const groupType = new Group({ store: 'docs' });

test.each([
  { input: '', valid: false },
  { input: '   ', valid: false },
  { input: '  _r2d2 ', valid: false },
  { input: '  2r2d2 ', valid: false },
  { input: '  docs ', valid: false },
  { input: '  docs: ', valid: false },
  { input: '  docs:lovely_doc-4238 ', valid: true },
  { input: '  docs:lovely_doc-4238:ru ', valid: true },
  { input: '  docs:path/to/lovely_doc-4238 ', valid: false },
  { input: '  docs:path/to/lovely_doc-4238:ru ', valid: false },
])('group type validation - $input', ({ input, valid }) => {
  expect(groupType.validate(input).isValid).toBe(valid);
});
