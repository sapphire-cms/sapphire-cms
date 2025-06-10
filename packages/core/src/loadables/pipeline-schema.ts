import { z } from 'zod';
import { idValidator } from '../common';
import { moduleRefValidator, toZodRefinement } from '../kernel';
import { PipelineRenderer, PipelineSchema } from '../model';

const ZPipelineRendererParamsSchema = z.record(
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
);

const ZRendererSchema = z.object({
  name: z.string().superRefine(toZodRefinement(moduleRefValidator)),
  params: ZPipelineRendererParamsSchema.optional(),
});

export const ZPipelineSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  source: z.string().superRefine(toZodRefinement(idValidator)),
  target: z.string().superRefine(toZodRefinement(moduleRefValidator)),
  shapers: z.array(z.string().superRefine(toZodRefinement(idValidator))).optional(),
  render: z.union([z.string().superRefine(toZodRefinement(moduleRefValidator)), ZRendererSchema]),
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
