import { z } from 'zod/mini';
import { toZodRefinement } from '../common';
import {
  asModule,
  ModuleReference,
  asId,
  idValidator,
  CapabilityReference,
  asCapability,
} from '../kernel';
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
    z.string().check(z.superRefine(toZodRefinement(CapabilityReference.validate))),
    z.transform(asCapability),
  ),
  params: z.optional(ZPipelineRendererParamsSchema),
});

export const ZPipelineSchema = z.object({
  name: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  source: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(CapabilityReference.validate))),
    z.transform(asCapability),
  ),
  target: z.pipe(
    z.string().check(z.superRefine(toZodRefinement(ModuleReference.validate))),
    z.transform(asModule),
  ),
  shapers: z.optional(
    z.array(
      z.pipe(
        z.string().check(z.superRefine(toZodRefinement(CapabilityReference.validate))),
        z.transform(asCapability),
      ),
    ),
  ),
  render: z.union([
    z.pipe(
      z.string().check(z.superRefine(toZodRefinement(CapabilityReference.validate))),
      z.transform(asCapability),
    ),
    ZRendererSchema,
  ]),
});

export function normalizePipelineSchema(
  zPipelineSchema: z.infer<typeof ZPipelineSchema>,
): PipelineSchema {
  const render: PipelineRenderer =
    typeof zPipelineSchema.render === 'string'
      ? {
          name: asCapability(zPipelineSchema.render),
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
