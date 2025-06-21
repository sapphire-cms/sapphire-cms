import { z } from 'zod';

const ZWebModule = z.object({
  name: z.string(),
  root: z.string(),
  mount: z.string(),
  spa: z.boolean().default(false),
});

export const ZManifestSchema = z.object({
  modules: z.array(z.string()).optional(),
  web: z.array(ZWebModule).optional(),
});
