import { expect, test } from 'vitest';
import { createModuleRef } from '../../src';

test.each([
  { module: 'codegen', capability: undefined, expected: '@codegen' },
  { module: 'codegen', capability: 'kotlin', expected: '@codegen/kotlin' },
  { module: 'default', capability: undefined, expected: '@default' },
  { module: 'default', capability: 'json', expected: 'json' },
])('createModuleRef', ({ module, capability, expected }) => {
  const moduleRef = createModuleRef(module, capability);
  expect(moduleRef).toStrictEqual(expected);
});
