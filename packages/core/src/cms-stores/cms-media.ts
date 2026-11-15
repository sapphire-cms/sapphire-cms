import { id } from '../common';
import { moduleRef } from '../kernel';
import { ContentSchema, ContentType } from '../model';

export const cmsMedia: ContentSchema = {
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
        name: moduleRef`tag`,
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
        name: moduleRef`text`,
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
        name: moduleRef`text`,
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
        name: moduleRef`text`,
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
        name: moduleRef`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: moduleRef`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`width`,
      type: {
        name: moduleRef`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: moduleRef`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`height`,
      type: {
        name: moduleRef`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: moduleRef`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`duration-in-ms`,
      type: {
        name: moduleRef`number`,
        params: {},
      },
      isList: false,
      required: false,
      index: false,
      validation: [
        {
          name: moduleRef`integer`,
          params: {},
        },
      ],
      fields: [],
    },
    {
      name: id`title`,
      type: {
        name: moduleRef`text`,
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
        name: moduleRef`text`,
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
        name: moduleRef`text`,
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
        name: moduleRef`group`,
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
            name: moduleRef`text`,
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
            name: moduleRef`text`,
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
