import { expect, test } from 'vitest';
import { replaceAt } from '../../src';

test('replaceAt', () => {
  const result = replaceAt('Hello World!', 6, 5, 'Sapphire');
  expect(result).toBe('Hello Sapphire!');
});
