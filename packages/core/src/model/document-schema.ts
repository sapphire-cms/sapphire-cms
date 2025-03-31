import {z} from 'zod';

export enum DocumentStoreType {

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

const FieldTypeParamsSchema = z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number(), z.boolean()])),
    ])
);

const FieldTypeSchema = z.object({
  name: z.string(),
  params: FieldTypeParamsSchema.optional(),
});

const ValidatorSchema = z.object({
  name: z.string(),
  params: FieldTypeParamsSchema.optional(),
});

const FieldSchema = z.object({
  name: z.string(),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.union([z.string(), FieldTypeSchema]),
  required: z.boolean().optional().default(false),
  validation: z.array(z.union([z.string(), ValidatorSchema])).optional(),
});

export const ZDocumentSchema = z.object({
  name: z.string(), // TODO: validate name. It should be a valid id
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(DocumentStoreType),
  fields: z.array(FieldSchema),
});

export type DocumentSchema = z.infer<typeof ZDocumentSchema>;
