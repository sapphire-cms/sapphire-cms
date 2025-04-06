import {z} from 'zod';
import {ContentType, idValidator, toZodRefinement} from '../common';

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

// TODO: example
const ZFieldSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.union([z.string(), ZFieldTypeSchema]),
  isList: z.boolean().optional().default(false),
  required: z.boolean().optional().default(false),
  validation: z.array(z.union([z.string(), ZValidatorSchema])).optional(),
});

// TODO: extention mechanism for content sschema (presets)
export const ZContentSchemaSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  fields: z.array(ZFieldSchema),
});

export type FieldTypeSchema = z.infer<typeof ZFieldTypeSchema>;
export type FieldTypeParamsSchema = z.infer<typeof ZFieldTypeParamsSchema>;
export type FieldSchema = z.infer<typeof ZFieldSchema>;
export type ContentSchema = z.infer<typeof ZContentSchemaSchema>;
