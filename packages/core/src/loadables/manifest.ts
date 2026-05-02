import { z } from 'zod';
import { Manifest, PlatformAdapter } from '../kernel';

const ZWebModule = z.object({
  name: z.string(),
  root: z.string(),
  mount: z.string(),
  spa: z.boolean().default(false),
});

const ZBundleConfig = z.object({
  exclude: z.array(z.string()).optional(),
});

const ZPlatformAdapter = z.object({
  name: z.string(),
  path: z.string(),
  bundle: ZBundleConfig.optional(),
});

export const ZManifestSchema = z.object({
  modules: z.array(z.string()).optional(),
  web: z.array(ZWebModule).optional(),
  platformAdapters: z.array(ZPlatformAdapter).optional(),
});

export function normalizeManifest(zManifestSchema: z.infer<typeof ZManifestSchema>): Manifest {
  return {
    modules: zManifestSchema.modules || [],
    web: zManifestSchema.web || [],
    platformAdapters: (zManifestSchema.platformAdapters || []).map(normalizePlatformAdapter),
  };
}

function normalizePlatformAdapter(
  zPlatformAdapter: z.infer<typeof ZPlatformAdapter>,
): PlatformAdapter {
  return {
    name: zPlatformAdapter.name,
    path: zPlatformAdapter.path,
    bundle: {
      exclude: zPlatformAdapter.bundle?.exclude || [],
    },
  };
}
