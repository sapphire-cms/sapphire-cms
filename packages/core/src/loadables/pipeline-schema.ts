import {z} from 'zod';
import {idValidator, toZodRefinement} from '../common';
import {PipelineRenderer, PipelineSchema} from '../common/pipeline-schema.types';

const ZPipelineRendererParamsSchema = z.record(
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.array(z.union([z.string(), z.number(), z.boolean()])),
    ])
);

const ZRendererSchema = z.object({
  name: z.string(),
  params: ZPipelineRendererParamsSchema.optional(),
});

export const ZPipelineSchema = z.object({
  name: z.string().superRefine(toZodRefinement(idValidator)),
  source: z.string().superRefine(toZodRefinement(idValidator)),
  target: z.string(),
  shapers: z.array(z.string()).optional(),
  render: z.union([z.string(), ZRendererSchema]),
});

export function hydratePipelineSchema(zPipelineSchema: z.infer<typeof ZPipelineSchema>): PipelineSchema {
  const render: PipelineRenderer = typeof zPipelineSchema.render === 'string'
      ? {
          name: zPipelineSchema.render,
          params: {},
      }
      : {
          name: zPipelineSchema.render.name,
          params: zPipelineSchema.render.params || {},
      }

  return {
    name: zPipelineSchema.name,
    source: zPipelineSchema.source,
    target: zPipelineSchema.target,
    shapers: zPipelineSchema.shapers || [],
    render,
  };
}
