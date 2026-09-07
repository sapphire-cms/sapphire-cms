import { z } from 'zod';
import { idValidator } from '../common';
import { toZodRefinement } from '../kernel';
import { FieldPipelineSchema, FieldShaperSchema, ShaperSchema } from '../model';

const ZFieldShaperParamsSchema = z.record(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
);

const ZFieldShaperSchema = z.object({
  fieldShaper: z.string(),
  params: ZFieldShaperParamsSchema.optional(),
});

const ZFieldPipelineSchema = z.object({
  source: z.string().superRefine(toZodRefinement(idValidator)),
  target: z.string().superRefine(toZodRefinement(idValidator)).optional(),
  shapers: z.array(z.union([z.string(), ZFieldShaperSchema])),
});

export const ZShaperSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  for: z.string().superRefine(toZodRefinement(idValidator)),
  fields: z.array(ZFieldPipelineSchema),
});

export function normalizeShaperSchema(zShaperSchema: z.infer<typeof ZShaperSchema>): ShaperSchema {
  const fields: FieldPipelineSchema[] = zShaperSchema.fields.map(normalizeFieldPipelineSchema);

  return {
    name: zShaperSchema.name,
    for: zShaperSchema.for,
    fields,
  };
}

function normalizeFieldPipelineSchema(
  zFieldPipelineSchema: z.infer<typeof ZFieldPipelineSchema>,
): FieldPipelineSchema {
  const shapers: FieldShaperSchema[] = zFieldPipelineSchema.shapers.map(normalizeFieldShaperSchema);

  return {
    source: zFieldPipelineSchema.source,
    target: zFieldPipelineSchema.target || zFieldPipelineSchema.source,
    shapers,
  };
}

function normalizeFieldShaperSchema(
  zFieldShaperSchema: string | z.infer<typeof ZFieldShaperSchema>,
): FieldShaperSchema {
  return typeof zFieldShaperSchema === 'string'
    ? {
        fieldShaper: zFieldShaperSchema,
        params: {},
      }
    : {
        fieldShaper: zFieldShaperSchema.fieldShaper,
        params: zFieldShaperSchema.params || {},
      };
}
