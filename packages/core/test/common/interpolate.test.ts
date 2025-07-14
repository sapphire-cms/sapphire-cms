import { interpolate } from '../../src';
import { expect, test } from 'vitest';

test('interpolate', () => {
  const env = {
    GITHUB_TOKEN: '123456789',
  };

  const template = 'github: ${env.GITHUB_TOKEN}, facebook: ${env.FACEBOOK_TOKEN}';
  const expected = 'github: 123456789, facebook: ';

  const result = interpolate(template, { env });
  expect(result).toBe(expected);
});
