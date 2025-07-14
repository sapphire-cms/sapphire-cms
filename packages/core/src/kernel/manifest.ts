export interface WebModule {
  name: string;
  root: string;
  mount: string;
  spa: boolean;
}

export interface BundleConfig {
  exclude: string[];
}

export interface PlatformAdapter {
  path: string;
  bundle: BundleConfig;
}

export interface Manifest {
  modules: string[];
  web: WebModule[];
  platformAdapters: PlatformAdapter[];
}
