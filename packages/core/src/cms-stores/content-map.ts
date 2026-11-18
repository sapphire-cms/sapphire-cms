import { capability, id } from '../kernel';
import { ContentSchema, ContentType } from '../model';

export type ContentMapDocument = {
  version: string;
  stores: string[];
};

export const contentMap: ContentSchema = {
  name: id`content-map`,
  type: ContentType.SINGLETON,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`version`,
      type: {
        name: capability`text`,
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: id`stores`,
      type: {
        name: capability`reference`,
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
  name: id`content-map-stores`,
  type: ContentType.COLLECTION,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`documents`,
      type: {
        name: capability`reference`,
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
  name: id`content-map-documents`,
  type: ContentType.TREE,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`variants`,
      type: {
        name: capability`reference`,
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
  name: id`content-map-variants`,
  type: ContentType.TREE,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`index`,
      type: {
        name: capability`text`,
        params: {},
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: id`rendered`,
      type: {
        name: capability`reference`,
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
  name: id`content-map-artifacts`,
  type: ContentType.TREE,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`mime`,
      type: {
        name: capability`text`,
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: id`encoding`,
      type: {
        name: capability`text`,
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: id`delivered`,
      type: {
        name: capability`reference`,
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
  name: id`content-map-locations`,
  type: ContentType.TREE,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`provider`,
      type: {
        name: capability`text`,
        params: {},
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: id`resourcePath`,
      type: {
        name: capability`text`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [],
      fields: [],
    },
    {
      name: id`url`,
      type: {
        name: capability`text`,
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
