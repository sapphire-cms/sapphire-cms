import {BootstrapLayer, ContentSchema, Module} from '@sapphire-cms/core';

export class BootLayer<Config> implements BootstrapLayer<Config> {
  constructor(private readonly delegate: BootstrapLayer<Config>,
              private readonly loadedModules: Module<any, any>[]) {
  }

  loadModules(): Promise<Module<any, any>[]> {
    return Promise.resolve(this.loadedModules);
  }

  getAllSchemas(): Promise<ContentSchema[]> {
    return this.delegate.getAllSchemas();
  }
}
