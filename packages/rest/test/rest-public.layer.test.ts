import { expect, test } from 'vitest';
import { _toContentFilter, _toContentSort, RestPublicLayer } from '../src/rest-public.layer';

test('toContentFilter', () => {
  const filter: Record<string, string> = {
    category: 'toys',
    price: '42.38',
    available: 'true',
  };

  const contentFilter = RestPublicLayer[_toContentFilter](filter);

  expect(contentFilter).toEqual({
    category: 'toys',
    price: 42.38,
    available: true,
  });
});

test('toContentSort', () => {
  const sort = '-publishedAt,title';

  const contentSort = RestPublicLayer[_toContentSort](sort);

  expect(contentSort).toEqual([
    {
      field: 'publishedAt',
      sort: 'desc',
    },
    {
      field: 'title',
      sort: 'asc',
    },
  ]);
});
