import { z } from 'zod';
import { ContentType } from './content-schema';
const FieldTypeParamsSchema = z.record(z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
]));
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
    required: z.boolean().optional(),
    validation: z.array(z.union([z.string(), ValidatorSchema])).optional(),
});
export const ContentSchema = z.object({
    name: z.string(),
    label: z.string().optional(),
    description: z.string().optional(),
    type: z.nativeEnum(ContentType),
    fields: z.array(FieldSchema),
});
//# sourceMappingURL=schema.js.map