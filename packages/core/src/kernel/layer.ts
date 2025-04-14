export interface Layer<Config> {
}

export enum BaseLayerType {
  ADMIN = 'admin',
  BOOTSTRAP = 'bootstrap',
  MANAGEMENT = 'management',
  PERSISTENCE = 'persistence',
  PLATFORM = 'platform',
}

export enum PluggableLayerType {
  CONTENT = 'content',
  RENDER = 'render',
  DELIVERY = 'delivery',
}

export const LayerType = {
  ...BaseLayerType,
  ...PluggableLayerType,
} as const;
