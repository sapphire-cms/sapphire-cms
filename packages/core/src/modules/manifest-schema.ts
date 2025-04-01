import {z} from 'zod';

export const ZManifestSchema = z.object({
  modules: z.array(z.string()),
});

// TODO: rename, it is not a Scheme, it is a Manifest
export type ManifestSchema = z.infer<typeof ZManifestSchema>;
