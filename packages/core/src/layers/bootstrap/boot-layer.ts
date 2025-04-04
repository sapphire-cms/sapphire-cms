import {BootstrapLayer} from './bootstrap.layer';
import {SapphireModuleClass} from './bootstrap.types';
import {ContentSchema} from '../../loadables';

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
