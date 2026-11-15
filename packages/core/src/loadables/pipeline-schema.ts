import { z } from 'zod/mini';
import { asId, idValidator } from '../common';
import { asRef, ModuleReference, toZodRefinement } from '../kernel';
import { PipelineRenderer, PipelineSchema } from '../model';

const ZPipelineRendererParamsSchema = z.record(
  z.string(),
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
);

const ZRendererSchema = z.object({
  name: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(ModuleReference.validate))),
    z.transform(asRef),
  ),
  params: z.optional(ZPipelineRendererParamsSchema),
});

export const ZPipelineSchema = z.object({
  name: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  source: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(ModuleReference.validate))),
    z.transform(asRef),
  ),
  target: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(ModuleReference.validate))),
    z.transform(asRef),
  ),
  shapers: z.optional(
    z.array(
      z.pipe(
        z.string().check(z.superRefine(toZodRefinement(ModuleReference.validate))),
        z.transform(asRef),
      ),
    ),
  ),
  render: z.union([
    z.string().check(z.superRefine(toZodRefinement(ModuleReference.validate))),
    ZRendererSchema,
  ]),
});

export function normalizePipelineSchema(
  zPipelineSchema: z.infer<typeof ZPipelineSchema>,
): PipelineSchema {
  const render: PipelineRenderer =
    typeof zPipelineSchema.render === 'string'
      ? {
          name: asRef(zPipelineSchema.render),
          params: {},
        }
      : {
          name: zPipelineSchema.render.name,
          params: zPipelineSchema.render.params || {},
        };

  return {
    name: zPipelineSchema.name,
    source: zPipelineSchema.source,
    target: zPipelineSchema.target,
    shapers: zPipelineSchema.shapers || [],
    render,
  };
}
