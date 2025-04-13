import {expect, test, describe} from 'vitest';
import {ContentSchema, ContentService, ContentType} from '../../src';

describe('test resolveVariant', () => {
  describe('when Schema Config has no declared variants', () => {
    const contentSchema: ContentSchema = {
      name: 'test-schema',
      type: ContentType.COLLECTION,
      fields: [],
    };

    test('when variant not provided', () => {
      const variant = ContentService.resolveVariant(contentSchema);
      expect(variant).toBe('default');
    });

    test('when any variant provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'es')).toThrow();
    });

    test('when variant "default" is provided', () => {
      const variant = ContentService.resolveVariant(contentSchema, 'default');
      expect(variant).toBe('default');
    });
  });

  describe('when Schema Config has declared variants as array', () => {
    const contentSchema: ContentSchema = {
      name: 'test-schema',
      type: ContentType.COLLECTION,
      fields: [],
      variants: [ 'en', 'ru' ],
    };

    test('when variant not provided', () => {
      const variant = ContentService.resolveVariant(contentSchema);
      expect(variant).toBe('en');
    });

    test('when any variant provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'es')).toThrow();
    });

    test('when variant "default" is provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'default')).toThrow();
    });

    test('when variant from the array provided', () => {
      const variant = ContentService.resolveVariant(contentSchema, 'ru');
      expect(variant).toBe('ru');
    });
  });

  describe('when Schema Config has declared variants as object (no default)', () => {
    const contentSchema: ContentSchema = {
      name: 'test-schema',
      type: ContentType.COLLECTION,
      fields: [],
      variants: {
        values: [ 'en', 'ru' ],
      }
    };

    test('when variant not provided', () => {
      const variant = ContentService.resolveVariant(contentSchema);
      expect(variant).toBe('en');
    });

    test('when any variant provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'es')).toThrow();
    });

    test('when variant "default" is provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'default')).toThrow();
    });

    test('when variant from the array provided', () => {
      const variant = ContentService.resolveVariant(contentSchema, 'ru');
      expect(variant).toBe('ru');
    });
  });

  describe('when Schema Config has declared variants as object (has default)', () => {
    const contentSchema: ContentSchema = {
      name: 'test-schema',
      type: ContentType.COLLECTION,
      fields: [],
      variants: {
        values: [ 'en', 'ru' ],
        default: 'ru',
      }
    };

    test('when variant not provided', () => {
      const variant = ContentService.resolveVariant(contentSchema);
      expect(variant).toBe('ru');
    });

    test('when any variant provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'es')).toThrow();
    });

    test('when variant "default" is provided', () => {
      expect(() => ContentService.resolveVariant(contentSchema, 'default')).toThrow();
    });

    test('when variant from the array provided', () => {
      const variant = ContentService.resolveVariant(contentSchema, 'en');
      expect(variant).toBe('en');
    });
  });
});
