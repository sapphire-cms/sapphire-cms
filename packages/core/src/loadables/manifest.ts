import { z } from 'zod/mini';
import { toZodRefinement } from '../common';
import { asId, idValidator } from '../kernel';

const ZWebModule = z.object({
  name: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  root: z.string(),
  mount: z.string(),
  spa: z._default(z.boolean(), false),
});

const ZBundleConfig = z.object({
  exclude: z._default(z.array(z.string()), []),
});

const ZPlatformAdapter = z.object({
  name: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  path: z.string(),
  bundle: z._default(ZBundleConfig, { exclude: [] }),
});

const ZPreset = z.object({
  name: z.pipe(z.string().check(z.superRefine(toZodRefinement(idValidator))), z.transform(asId)),
  schemas: z._default(z.array(z.string()), []),
});

export const ZManifestSchema = z.object({
  modules: z._default(z.array(z.string()), []),
  web: z._default(z.array(ZWebModule), []),
  platformAdapters: z._default(z.array(ZPlatformAdapter), []),
  presets: z._default(z.array(ZPreset), []),
});
