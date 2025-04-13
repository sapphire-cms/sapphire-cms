export interface Layer<Config> {
}

export enum LayerType {
  ADMIN = 'admin',
  BOOTSTRAP = 'bootstrap',
  CONTENT = 'content',
  MANAGEMENT = 'management',
  PERSISTENCE = 'persistence',
  PLATFORM = 'platform',
  RENDER = 'render',
  DELIVERY = 'delivery',
}
