import { z } from 'zod/mini';
import { moduleRefValidator, toZodRefinement } from '../kernel';

const ZModuleRefSchema = z.optional(
  z.string().check(z.superRefine(toZodRefinement(moduleRefValidator))),
);

const ZScalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const ZModuleConfigValueSchema = z.union([ZScalarSchema, z.array(ZScalarSchema)]);

export const ZCmsConfigSchema = z.object({
  version: z.optional(z.string()),

  config: z.object({
    debug: z.boolean(),

    modules: z._default(
      z.array(
        z.object({
          module: z.string(),
          config: z.record(z.string(), ZModuleConfigValueSchema),
        }),
      ),
      [],
    ),
  }),

  layers: z.object({
    bootstrap: ZModuleRefSchema,
    persistence: ZModuleRefSchema,
    backup: ZModuleRefSchema,
    admin: ZModuleRefSchema,
    management: ZModuleRefSchema,
    public: ZModuleRefSchema,
    platform: ZModuleRefSchema,
    security: ZModuleRefSchema,
    media: ZModuleRefSchema,
  }),
});
