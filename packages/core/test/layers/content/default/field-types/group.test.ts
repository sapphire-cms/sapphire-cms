import {expect, test} from 'vitest';
import {Group} from '../../../../../src';

const groupType = new Group({ 'hidden-collection': 'docs' });

test.each([
  { input: '  docs/lovely_doc-4238 ', valid: true },
  { input: '  clients/lovely_doc-4238 ', valid: false },
  { input: '  docs/path/to/lovely_doc-4238 ', valid: false },
  { input: '  clients/path/to/lovely_doc-4238 ', valid: false },
])('group type validation - $input', ({ input, valid }) => {
  expect(groupType.validate(input).isValid).toBe(valid);
});
