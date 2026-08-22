import * as contentMapJson from './content-map.test.json';
import { ContentMap } from '@sapphire-cms/core';
import { test, describe, expect } from 'vitest';
import { StaticStoreContentLocator } from '../../../src';

const contentMap = contentMapJson as ContentMap;
const storeMap = contentMap.stores['sponsor-tier'];
const locator = new StaticStoreContentLocator(storeMap);

describe('resolve', () => {
  test('when location resolved', () => {
    const location = locator.resolve(
      'sponsor-tier',
      [],
      'amethyst',
      'default',
      'application/typescript',
    );

    expect(location).toEqual({
      store: 'sponsor-tier',
      path: [],
      docId: 'amethyst',
      variant: 'default',
      mediaType: 'application/typescript',
      provider: 'node',
      index: {
        available: true,
        category: '#sponsor',
        donation: 1000,
      },
      resourcePath: 'sponsor-tier/amethyst/default.ts',
      url: undefined,
    });
  });

  test.each([
    {
      store: 'feature',
      path: [],
      docId: 'amethyst',
      variant: 'default',
      mediaType: 'application/typescript',
    },
    {
      store: 'sponsor-tier',
      path: ['level'],
      docId: 'amethyst',
      variant: 'default',
      mediaType: 'application/typescript',
    },
    {
      store: 'sponsor-tier',
      path: [],
      docId: 'carnelian',
      variant: 'default',
      mediaType: 'application/typescript',
    },
    {
      store: 'sponsor-tier',
      path: [],
      docId: 'amethyst',
      variant: 'en',
      mediaType: 'application/typescript',
    },
    {
      store: 'sponsor-tier',
      path: [],
      docId: 'amethyst',
      variant: 'default',
      mediaType: 'application/json',
    },
  ])('when location not resolved', ({ store, path, docId, variant, mediaType }) => {
    const location = locator.resolve(store, path, docId, variant, mediaType);

    expect(location).not.toBeDefined();
  });
});

describe('list', () => {
  describe('pagination', () => {
    test('when result is an empty page', () => {
      const page = locator.list('feature', [], {}, { page: 0, size: 10 }, {}, []);

      expect(page).toEqual({
        content: [],
        pagination: {
          pageNumber: 0,
          pageSize: 10,
          totalElements: 0,
          totalPages: 0,
          isLast: true,
        },
      });
    });

    test('when result is non existing page', () => {
      const page = locator.list('sponsor-tier', [], {}, { page: 5, size: 10 }, {}, []);

      expect(page).toEqual({
        content: [],
        pagination: {
          pageNumber: 5,
          pageSize: 10,
          totalElements: 5,
          totalPages: 1,
          isLast: true,
        },
      });
    });

    test('when not last page', () => {
      const page = locator.list('sponsor-tier', [], {}, { page: 0, size: 3 }, {}, []);

      expect(page.content).length(3);
      expect(page.pagination).toEqual({
        pageNumber: 0,
        pageSize: 3,
        totalElements: 5,
        totalPages: 2,
        isLast: false,
      });
    });

    test('when last page', () => {
      const page = locator.list('sponsor-tier', [], {}, { page: 1, size: 3 }, {}, []);

      expect(page.content).length(2);
      expect(page.pagination).toEqual({
        pageNumber: 1,
        pageSize: 3,
        totalElements: 5,
        totalPages: 2,
        isLast: true,
      });
    });
  });

  test('filtering', () => {
    const page = locator.list(
      'sponsor-tier',
      [],
      {},
      { page: 0, size: 10 },
      {
        category: '#founding partner',
      },
      [],
    );

    expect(page.content).length(1);
    expect(page.content[0].docId).equals('obsidian');
    expect(page.pagination).toEqual({
      pageNumber: 0,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      isLast: true,
    });
  });

  test('sort', () => {
    const page = locator.list('sponsor-tier', [], {}, { page: 0, size: 10 }, {}, [
      {
        field: 'category',
        sort: 'asc',
      },
      {
        field: 'donation',
        sort: 'desc',
      },
    ]);

    const docIds = page.content.map((location) => location.docId);

    expect(docIds).toEqual(['obsidian', 'diamond', 'ruby', 'amethyst', 'quartz']);
  });
});
