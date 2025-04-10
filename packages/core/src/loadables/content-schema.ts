import {z, ZodType} from 'zod';
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

type FieldShape = {
  name: string;
  label?: string;
  description?: string;
  example?: string;
  type: string | z.infer<typeof ZFieldTypeSchema>;
  isList?: boolean;
  required?: boolean;
  validation?: Array<string | z.infer<typeof ZValidatorSchema>>;
  fields?: FieldShape[];
};

const ZFieldSchema: ZodType<FieldShape> = z.lazy(() => z.object({
    name: z.string().superRefine(toZodRefinement(idValidator)),
    label: z.string().optional(),
    description: z.string().optional(),
    example: z.string().optional(),
    type: z.union([z.string(), ZFieldTypeSchema]),
    isList: z.boolean().optional().default(false),
    required: z.boolean().optional().default(false),
    validation: z.array(z.union([z.string(), ZValidatorSchema])).optional(),
    // TODO: should be present only if type = group
    fields: z.array(ZFieldSchema).optional(),
  })
);

const ZContentVariantsSchema = z.object({
  values: z.array(z.string()),
  default: z.string().optional(),
});

// TODO: extention mechanism for content sschema (presets)
export const ZContentSchemaSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  label: z.string().optional(),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  variants: z.union([ z.array(z.string()), ZContentVariantsSchema ]).optional(),
  fields: z.array(ZFieldSchema),
});

export type FieldTypeSchema = z.infer<typeof ZFieldTypeSchema>;
export type FieldTypeParamsSchema = z.infer<typeof ZFieldTypeParamsSchema>;
export type FieldSchema = z.infer<typeof ZFieldSchema>;
export type ContentVariantsSchema = z.infer<typeof ZContentVariantsSchema>;
export type ContentSchema = z.infer<typeof ZContentSchemaSchema>;

export function createHiddenCollectionSchema(contentSchema: ContentSchema, groupFieldSchema: FieldSchema): ContentSchema {
  return {
    name: `${contentSchema.name}__field-${groupFieldSchema.name}`,
    type: ContentType.COLLECTION,
    fields: groupFieldSchema.fields || [],
  };
}
