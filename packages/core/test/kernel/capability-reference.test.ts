import { expect, test } from 'vitest';
import { id, CapabilityReference } from '../../src';

test.each([
  { input: '@codegen', valid: false },
  { input: '@codegen/kotlin', valid: true },
  { input: '@default', valid: false },
  { input: '@default/json', valid: true },
  { input: 'json', valid: true },
  { input: 'default/json', valid: false },
  { input: 'default/parsers/json', valid: false },
  { input: '', valid: false },
])('Validation when input is $input', ({ input, valid }) => {
  expect(CapabilityReference.validate(input).isValid).toBe(valid);
});

test.each([
  { module: id`codegen`, capability: id`kotlin`, key: '@codegen/kotlin' },
  { module: id`default`, capability: id`json`, key: 'json' },
])('Create from module $module and capability $capability', ({ module, capability, key }) => {
  const moduleRef = new CapabilityReference(module, capability);
  expect(moduleRef.key).toStrictEqual(key);
});

test.each([
  { ref: '@codegen/kotlin', module: 'codegen', capability: 'kotlin' },
  { ref: '@default/json', module: 'default', capability: 'json' },
  { ref: 'json', module: 'default', capability: 'json' },
])('parse $ref', ({ ref, module, capability }) => {
  const moduleRef = CapabilityReference.parse(ref);
  expect(moduleRef.module).toStrictEqual(module);
  expect(moduleRef.capability).toStrictEqual(capability);
});
