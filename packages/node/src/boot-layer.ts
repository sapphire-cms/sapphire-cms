import {BootstrapLayer, ContentSchema, SapphireModuleClass} from '@sapphire-cms/core';

export class BootLayer<Config> implements BootstrapLayer<Config> {
  constructor(private readonly delegate: BootstrapLayer<Config>,
              private readonly loadedModules: SapphireModuleClass<any, any>[]) {
  }

  loadModules(): Promise<SapphireModuleClass<any, any>[]> {
    return Promise.resolve(this.loadedModules);
  }

  getAllSchemas(): Promise<ContentSchema[]> {
    return this.delegate.getAllSchemas();
  }
}
