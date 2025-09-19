import { z } from 'zod';
import { moduleRefValidator, toZodRefinement } from '../kernel';

export const ZCmsConfigSchema = z.object({
  version: z.string().optional(),
  config: z.object({
    debug: z.boolean(),
    modules: z
      .array(
        z.object({
          module: z.string(),
          config: z.record(
            z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.array(z.union([z.string(), z.number(), z.boolean()])),
            ]),
          ),
        }),
      )
      .default([]),
  }),
  layers: z.object({
    bootstrap: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    persistence: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    admin: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    management: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    platform: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
  }),
});
