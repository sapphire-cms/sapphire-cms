import { Id } from '../kernel';

export interface WebModule {
  name: Id;
  root: string;
  mount: string;
  spa: boolean;
}

export interface BundleConfig {
  exclude: string[];
}

export interface PlatformAdapter {
  name: Id;
  path: string;
  bundle: BundleConfig;
}

export interface Preset {
  name: Id;
  schemas: string[];
}

export interface Manifest {
  modules: string[];
  web: WebModule[];
  platformAdapters: PlatformAdapter[];
  presets: Preset[];
}
