export interface WebModule {
  name: string;
  root: string;
  mount: string;
  spa: boolean;
}

export interface Manifest {
  modules?: string[];
  web?: WebModule[];
  platformAdapters?: string[];
}
