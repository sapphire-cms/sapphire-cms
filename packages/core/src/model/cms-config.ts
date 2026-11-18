import { deepClone } from '../common';
import { Id, ModuleReferenceKey } from '../kernel';

export interface ModuleConfig {
  module: Id;
  config: Record<string, string | number | boolean | Array<string | number | boolean>>;
}

export interface ModulesConfig {
  debug?: boolean;
  modules: ModuleConfig[];
}

export interface LayersConfig {
  bootstrap?: ModuleReferenceKey;
  persistence?: ModuleReferenceKey;
  backup?: ModuleReferenceKey;
  admin?: ModuleReferenceKey;
  management?: ModuleReferenceKey;
  public?: ModuleReferenceKey;
  platform?: ModuleReferenceKey;
  security?: ModuleReferenceKey;
  media?: ModuleReferenceKey;
}

export interface CmsConfig {
  profile?: Id;
  extends?: string;
  config: ModulesConfig;
  layers: LayersConfig;
}

export function overloadCmsConfig(base: CmsConfig, overload: CmsConfig): CmsConfig {
  const result = deepClone(base);

  // Overload profile
  result.profile = overload.profile;

  // Overload debug
  result.config.debug = overload.config.debug || result.config.debug;

  // Overload layers
  Object.assign(result.layers, overload.layers);

  // Index base modules
  const modules = new Map(result.config.modules.map((module) => [module.module, module]));

  // Overload modules
  for (const module of overload.config.modules) {
    const existing = modules.get(module.module);

    if (existing) {
      Object.assign(existing.config, module.config);
    } else {
      const newModule = deepClone(module);
      result.config.modules.push(newModule);
      modules.set(module.module, newModule);
    }
  }

  return result;
}
