import {z} from 'zod';

export const ZManifestSchema = z.object({
  modules: z.array(z.string()),
});

export type Manifest = z.infer<typeof ZManifestSchema>;
