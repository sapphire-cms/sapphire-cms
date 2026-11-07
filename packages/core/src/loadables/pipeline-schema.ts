import { z } from 'zod/mini';
import { idValidator } from '../common';
import { moduleRefValidator, toZodRefinement } from '../kernel';
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
  name: z.string(),
  params: z.optional(ZPipelineRendererParamsSchema),
});

export const ZPipelineSchema = z.object({
  name: z.string().check(z.superRefine(toZodRefinement(idValidator))),
  source: z.string().check(z.superRefine(toZodRefinement(idValidator))),
  target: z.string().check(z.superRefine(toZodRefinement(moduleRefValidator))),
  shapers: z.optional(z.array(z.string().check(z.superRefine(toZodRefinement(idValidator))))),
  render: z.union([z.string(), ZRendererSchema]),
});

export function normalizePipelineSchema(
  zPipelineSchema: z.infer<typeof ZPipelineSchema>,
): PipelineSchema {
  const render: PipelineRenderer =
    typeof zPipelineSchema.render === 'string'
      ? {
          name: zPipelineSchema.render,
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
