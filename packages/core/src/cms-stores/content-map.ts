import { ContentSchema, ContentType } from '../model';

export type ContentMapDocument = {
  version: string;
  stores: string[];
};

export const contentMap: ContentSchema = {
  name: 'content-map',
  type: ContentType.SINGLETON,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'version',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: 'stores',
      type: {
        name: 'reference',
        params: {
          store: 'content-map-stores',
        },
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
  ],
};

export type StoreMapDocument = {
  documents: string[];
};

export const storeMap: ContentSchema = {
  name: 'content-map-stores',
  type: ContentType.COLLECTION,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'documents',
      type: {
        name: 'reference',
        params: {
          store: 'content-map-documents',
        },
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
  ],
};

export type DocumentMapDocument = {
  variants: string[];
};

export const documentMap: ContentSchema = {
  name: 'content-map-documents',
  type: ContentType.TREE,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'variants',
      type: {
        name: 'reference',
        params: {
          store: 'content-map-variants',
        },
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
  ],
};

export type VariantMapDocument = {
  index: string[];
  rendered: string[];
};

export const variantMap: ContentSchema = {
  name: 'content-map-variants',
  type: ContentType.TREE,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'index',
      type: {
        name: 'text',
        params: {},
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: 'rendered',
      type: {
        name: 'reference',
        params: {
          store: 'content-map-artifacts',
        },
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
  ],
};

export type ArtifactMapDocument = {
  mime: string;
  encoding: string;
  delivered: string[];
};

export const artifactMap: ContentSchema = {
  name: 'content-map-artifacts',
  type: ContentType.TREE,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'mime',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: 'encoding',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: 'delivered',
      type: {
        name: 'reference',
        params: {
          store: 'content-map-locations',
        },
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
  ],
};

export type LocationMapDocument = {
  provider: string;
  resourcePath?: string;
  url?: string;
};

export const locationMap: ContentSchema = {
  name: 'content-map-locations',
  type: ContentType.TREE,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'provider',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: 'resourcePath',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: 'url',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [],
      fields: [],
    },
  ],
};
