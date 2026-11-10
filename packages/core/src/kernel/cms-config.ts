import { deepClone } from '../common';

export interface ModuleConfig {
  module: string;
  config: Record<string, string | number | boolean | Array<string | number | boolean>>;
}

export interface ModulesConfig {
  debug?: boolean;
  modules: ModuleConfig[];
}

export interface LayersConfig {
  bootstrap?: string;
  persistence?: string;
  backup?: string;
  admin?: string;
  management?: string;
  public?: string;
  platform?: string;
  security?: string;
  media?: string;
}

export interface CmsConfig {
  profile?: string;
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
