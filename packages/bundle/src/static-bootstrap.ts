import { CmsConfig, StaticBootstrapLayer } from '@sapphire-cms/core';

/**
 * Placeholder static bootstrap layer used in platform adapters.
 * This value is replaced automatically by the Sapphire CMS AOT bundler during the build process.
 * Do not use this constant directly — it only exists to satisfy import structure before bundling.
 */
export const staticBootstrap: StaticBootstrapLayer = new StaticBootstrapLayer(
  {} as CmsConfig,
  [],
  [],
  [],
  [],
);
