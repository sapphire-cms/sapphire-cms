import { expect, test } from 'vitest';
import { createModuleRef, moduleRefValidator, parseModuleRef } from '../../src';

test.each([
  { input: '@codegen', valid: true },
  { input: '@codegen/kotlin', valid: true },
  { input: '@default', valid: true },
  { input: '@default/json', valid: true },
  { input: 'json', valid: true },
  { input: 'default/json', valid: false },
  { input: 'default/parsers/json', valid: false },
  { input: '', valid: false },
])('moduleRefValidator validation when input is $input', ({ input, valid }) => {
  expect(moduleRefValidator(input).isValid).toBe(valid);
});

test.each([
  { module: 'codegen', capability: undefined, expected: '@codegen' },
  { module: 'codegen', capability: 'kotlin', expected: '@codegen/kotlin' },
  { module: 'default', capability: undefined, expected: '@default' },
  { module: 'default', capability: 'json', expected: 'json' },
])(
  'createModuleRef from module $module and capability $capability',
  ({ module, capability, expected }) => {
    const moduleRef = createModuleRef(module, capability);
    expect(moduleRef).toStrictEqual(expected);
  },
);

test.each([
  { ref: '@codegen', module: 'codegen', capability: undefined },
  { ref: '@codegen/kotlin', module: 'codegen', capability: 'kotlin' },
  { ref: '@default', module: 'default', capability: undefined },
  { ref: '@default/json', module: 'default', capability: 'json' },
  { ref: 'json', module: 'default', capability: 'json' },
])('parseModuleRef $ref', ({ ref, module, capability }) => {
  const parsed = parseModuleRef(ref);
  expect(parsed[0]).toStrictEqual(module);
  expect(parsed[1]).toStrictEqual(capability);
});
