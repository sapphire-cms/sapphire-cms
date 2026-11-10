import { z } from 'zod/mini';
import { idValidator } from '../common';
import { moduleRefValidator, toZodRefinement } from '../kernel';

const ZModuleRefSchema = z.optional(
  z.string().check(z.superRefine(toZodRefinement(moduleRefValidator))),
);

const ZScalarSchema = z.union([z.string(), z.number(), z.boolean()]);

const ZModuleConfigValueSchema = z.union([ZScalarSchema, z.array(ZScalarSchema)]);

export const ZCmsConfigSchema = z.object({
  profile: z.optional(z.string()),
  extends: z.optional(z.string()),

  config: z._default(
    z.object({
      debug: z.optional(z.boolean()),

      modules: z._default(
        z.array(
          z.object({
            module: z.string().check(z.superRefine(toZodRefinement(idValidator))),
            config: z.record(z.string(), ZModuleConfigValueSchema),
          }),
        ),
        [],
      ),
    }),
    { modules: [] },
  ),

  layers: z._default(
    z.object({
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
    {},
  ),
});
