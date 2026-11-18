import { z } from 'zod/mini';
import { toZodRefinement } from '../common';
import { asCapability, CapabilityReference, asId, idValidator } from '../kernel';
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
  fieldShaper: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(CapabilityReference.validate))),
    z.transform(asCapability),
  ),
  params: z.optional(ZFieldShaperParamsSchema),
});

const ZFieldPipelineSchema = z.object({
  source: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  target: z.optional(
    z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  ),
  shapers: z.array(z.union([z.string(), ZFieldShaperSchema])),
});

export const ZShaperSchema = z.object({
  name: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  for: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(CapabilityReference.validate))),
    z.transform(asCapability),
  ),
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
        fieldShaper: asCapability(zFieldShaperSchema),
        params: {},
      }
    : {
        fieldShaper: zFieldShaperSchema.fieldShaper,
        params: zFieldShaperSchema.params || {},
      };
}
