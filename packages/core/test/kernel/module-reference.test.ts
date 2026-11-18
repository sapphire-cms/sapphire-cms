import { expect, test } from 'vitest';
import { ModuleReference } from '../../src';

test.each([
  { input: '@codegen', valid: true },
  { input: '@codegen/kotlin', valid: false },
  { input: '@default', valid: true },
  { input: '@default/json', valid: false },
  { input: 'json', valid: false },
  { input: '@', valid: false },
  { input: '', valid: false },
])('Validation when input is $input', ({ input, valid }) => {
  expect(ModuleReference.validate(input).isValid).toBe(valid);
});

test.each([
  { ref: '@codegen', module: 'codegen' },
  { ref: '@default', module: 'default' },
])('parse $ref', ({ ref, module }) => {
  const moduleRef = ModuleReference.parse(ref);
  expect(moduleRef.module).toStrictEqual(module);
});
