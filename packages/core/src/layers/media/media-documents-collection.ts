import { ContentSchema, ContentType } from '../../model';

export const MediaDocumentsCollection: ContentSchema = {
  name: 'cms-media',
  type: ContentType.TREE,
  variants: {
    values: ['default'],
    default: 'default',
  },
  fields: [
    {
      name: 'type',
      type: {
        name: 'tag',
        params: {
          values: ['image', 'video'],
          multiple: false,
        },
      },
      isList: false,
      required: true,
      validation: [],
      fields: [],
    },
    {
      name: 'provider',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      validation: [],
      fields: [],
    },
    {
      name: 'provider-ref',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      validation: [],
      fields: [],
    },
    {
      name: 'mime-type',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: true,
      validation: [],
      fields: [],
    },
    {
      name: 'size-in-bytes',
      type: {
        name: 'number',
        params: {},
      },
      isList: false,
      required: false,
      validation: [
        {
          name: 'integer',
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: 'width',
      type: {
        name: 'number',
        params: {},
      },
      isList: false,
      required: false,
      validation: [
        {
          name: 'integer',
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: 'height',
      type: {
        name: 'number',
        params: {},
      },
      isList: false,
      required: false,
      validation: [
        {
          name: 'integer',
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: 'duration-in-ms',
      type: {
        name: 'number',
        params: {},
      },
      isList: false,
      required: false,
      validation: [
        {
          name: 'integer',
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: 'title',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: false,
      validation: [],
      fields: [],
    },
    {
      name: 'alt',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: false,
      validation: [],
      fields: [],
    },
    {
      name: 'caption',
      type: {
        name: 'text',
        params: {},
      },
      isList: false,
      required: false,
      validation: [],
      fields: [],
    },
    {
      name: 'metadata',
      type: {
        name: 'group',
        params: {},
      },
      isList: true,
      required: true,
      validation: [],
      fields: [
        {
          name: 'key',
          type: {
            name: 'text',
            params: {},
          },
          isList: false,
          required: true,
          validation: [],
          fields: [],
        },
        {
          name: 'value',
          type: {
            name: 'text',
            params: {},
          },
          isList: false,
          required: true,
          validation: [],
          fields: [],
        },
      ],
    },
  ],
};
