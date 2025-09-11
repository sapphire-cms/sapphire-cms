export interface ModuleConfig {
  module: string;
  config: Record<string, string | number | boolean | Array<string | number | boolean>>;
}

export interface ModulesConfig {
  debug: boolean;
  modules: ModuleConfig[];
}

export interface LayersConfig {
  bootstrap?: string;
  persistence?: string;
  admin?: string;
  management?: string;
  platform?: string;
  security?: string;
}

export interface CmsConfig {
  version?: string;
  config: ModulesConfig;
  layers: LayersConfig;
}
