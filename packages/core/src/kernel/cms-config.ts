export interface ModulesConfig {
  debug: boolean;
  modules: Record<
    string,
    Record<string, string | number | boolean | Array<string | number | boolean>>
  >;
}

export interface LayersConfig {
  bootstrap?: string;
  persistence?: string;
  admin?: string;
  management?: string;
  platform?: string;
}

export interface CmsConfig {
  version?: string;
  config: ModulesConfig;
  layers: LayersConfig;
}
