import { z } from 'zod/mini';
import { Manifest, PlatformAdapter } from '../kernel';

const ZWebModule = z.object({
  name: z.string(),
  root: z.string(),
  mount: z.string(),
  spa: z._default(z.boolean(), false),
});

const ZBundleConfig = z.object({
  exclude: z.optional(z.array(z.string())),
});

const ZPlatformAdapter = z.object({
  name: z.string(),
  path: z.string(),
  bundle: z.optional(ZBundleConfig),
});

export const ZManifestSchema = z.object({
  modules: z.optional(z.array(z.string())),
  web: z.optional(z.array(ZWebModule)),
  platformAdapters: z.optional(z.array(ZPlatformAdapter)),
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
