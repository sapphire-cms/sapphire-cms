import {z} from 'zod';

// TODO: authomatic expression replacement ${env.GITHUB_PERSONAL_ACCESS_TOKEN}
export const ZCmsConfigSchema = z.object({
  config: z.object({
    debug: z.boolean(),
    modules: z.record(z.record(
        z.union([
          z.string(),
          z.number(),
          z.boolean(),
          z.array(z.union([ z.string(), z.number(), z.boolean() ])),
        ])
    )),
  }),
  layers: z.object({
    content: z.string().optional(),
    bootstrap: z.string().optional(),
    persistence: z.string().optional(),
    admin: z.string().optional(),
    management: z.string().optional(),
    platform: z.string().optional(),
    // TODO: allow multiple render layers
    render: z.string().optional(),
    // TODO: allow multiple delivery layers
    delivery: z.string().optional(),
  }),
});

export type CmsConfig = z.infer<typeof ZCmsConfigSchema>;
