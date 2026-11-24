import { expect, test } from 'vitest';
import { getStore, ContentSchema, ContentType, id } from '../../../src';

test.each([
  { preset: id`default`, name: id`docs`, store: id`docs` },
  { preset: id`blog`, name: id`article`, store: id`blog-article` },
])('getStore', ({ preset, name, store }) => {
  const schema: ContentSchema = {
    preset,
    name,
    type: ContentType.COLLECTION,
    variants: {
      values: [id`default`],
      default: id`default`,
    },
    fields: [],
  };

  expect(getStore(schema)).toBe(store);
});
