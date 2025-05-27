import { z } from 'zod';
import { toZodRefinement } from '../common';
import { moduleRefValidator } from '../kernel';

// TODO: authomatic expression replacement ${env.GITHUB_PERSONAL_ACCESS_TOKEN}
export const ZCmsConfigSchema = z.object({
  version: z.string().optional(),
  config: z.object({
    debug: z.boolean(),
    modules: z.record(
      z.record(
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.union([z.string(), z.number(), z.boolean()])),
        ]),
      ),
    ),
  }),
  layers: z.object({
    bootstrap: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    persistence: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    admin: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    management: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
    platform: z.string().superRefine(toZodRefinement(moduleRefValidator)).optional(),
  }),
});
