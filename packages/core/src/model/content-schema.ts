import {z} from 'zod';

export enum ContentType {

  /**
   * A single, unique document. Not meant to be duplicated or listed.
   */
  SINGLETON = 'singleton',

  /**
   * A flat list (array) of documents of the same type.
   */
  COLLECTION = 'collection',

  /**
   * A hierarchical structure of documents, similar to a file system.
   */
  TREE = 'tree',
}

const ZFieldTypeParamsSchema = z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number(), z.boolean()])),
    ])
);

const ZFieldTypeSchema = z.object({
  name: z.string(),
  params: ZFieldTypeParamsSchema.optional(),
});

const ZValidatorSchema = z.object({
  name: z.string(),
  params: ZFieldTypeParamsSchema.optional(),
});

const ZFieldSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.union([z.string(), ZFieldTypeSchema]),
  isList: z.boolean().optional().default(false),
  required: z.boolean().optional().default(false),
  validation: z.array(z.union([z.string(), ZValidatorSchema])).optional(),
});

export const ZContentSchema = z.object({
  name: z.string(), // TODO: validate name. It should be a valid id
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  fields: z.array(ZFieldSchema),
});

export type FieldTypeSchema = z.infer<typeof ZFieldTypeSchema>;
export type FieldTypeParams = z.infer<typeof ZFieldTypeParamsSchema>;
export type FieldSchema = z.infer<typeof ZFieldSchema>;
export type ContentSchema = z.infer<typeof ZContentSchema>;
