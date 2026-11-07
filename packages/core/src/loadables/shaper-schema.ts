import { z } from 'zod/mini';
import { idValidator } from '../common';
import { toZodRefinement } from '../kernel';
import { FieldPipelineSchema, FieldShaperSchema, ShaperSchema } from '../model';

const ZFieldShaperParamsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
);

const ZFieldShaperSchema = z.object({
  fieldShaper: z.string(),
  params: z.optional(ZFieldShaperParamsSchema),
});

const ZFieldPipelineSchema = z.object({
  source: z.string().check(z.superRefine(toZodRefinement(idValidator))),
  target: z.optional(z.string().check(z.superRefine(toZodRefinement(idValidator)))),
  shapers: z.array(z.union([z.string(), ZFieldShaperSchema])),
});

export const ZShaperSchema = z.object({
  name: z.string().check(z.superRefine(toZodRefinement(idValidator))),
  for: z.string().check(z.superRefine(toZodRefinement(idValidator))),
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
