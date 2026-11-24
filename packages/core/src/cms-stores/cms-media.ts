import { capability, DEFAULT_MODULE_NAME, id } from '../kernel';
import { ContentSchema, ContentType } from '../model';

export const cmsMedia: ContentSchema = {
  preset: DEFAULT_MODULE_NAME,
  name: id`cms-media`,
  type: ContentType.TREE,
  variants: {
    values: [id`default`],
    default: id`default`,
  },
  fields: [
    {
      name: id`type`,
      type: {
        name: capability`tag`,
        params: {
          values: ['image', 'video'],
          multiple: false,
        },
      },
      isList: false,
      required: true,
      index: false,
      validation: [],
      fields: [],
    },
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
      name: id`provider-ref`,
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
      name: id`mime-type`,
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
      name: id`size-in-bytes`,
      type: {
        name: capability`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: capability`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`width`,
      type: {
        name: capability`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: capability`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`height`,
      type: {
        name: capability`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: capability`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`duration-in-ms`,
      type: {
        name: capability`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: capability`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`title`,
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
      name: id`alt`,
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
      name: id`caption`,
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
      name: id`metadata`,
      type: {
        name: capability`group`,
        params: {},
      },
      isList: true,
      required: true,
      index: false,
      validation: [],
      fields: [
        {
          name: id`key`,
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
          name: id`value`,
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
      ],
    },
  ],
};
