import {
  BootstrapLayer,
  CmsConfig,
  ContentLayer,
  DefaultModule,
  Module,
  PersistenceLayer,
  SapphireCms
} from '@sapphire-cms/core';
import {BootLayer} from './boot-layer';

export class AppFactory {
  private readonly modules = new Map<string, Module<any, any>>();

  constructor(private readonly cmsConfig: CmsConfig,
              private readonly loader: BootstrapLayer<any>,
              private readonly loadedModules: Module<any, any>[]) {
    for (const module of loadedModules) {
      this.modules.set(module.name, module);
    }
  }

  public async createSapphireCms(): Promise<SapphireCms> {
    const contentLayer = this.createContentLayer();
    const boostrapLayer = await this.createBootstrapLayer();
    const persistenceLayer = await this.createPersistenceLayer();
    const cms = new SapphireCms(boostrapLayer, contentLayer, persistenceLayer);
    return Promise.resolve(cms);
  }

  private createContentLayer(): ContentLayer<any> {
    // TODO: code the merge of content layers
    return DefaultModule.layers.content as ContentLayer<any>;
  }

  private async createBootstrapLayer(): Promise<BootstrapLayer<any>> {
    const bootstrap = this.cmsConfig.layers.bootstrap;

    if (!bootstrap || bootstrap === '@node') {
      // Reuse existing boot layer
      return new BootLayer(this.loader, this.loadedModules);
    } else if (bootstrap.startsWith('@')) {
      // Load from named module
      const moduleName = bootstrap.slice(1);
      const module = this.getNamedModule(moduleName);

      if (!module.layers.bootstrap) {
        throw new Error(`Module "${moduleName}" do not provide bootstrap layer`);
      }

      const moduleConfig = this.cmsConfig.config.modules[moduleName];
      const bootstrapLayer = new module.layers.bootstrap(moduleConfig);
      return new BootLayer(bootstrapLayer, this.loadedModules);
    } else {
      // Load from the file
      const bootstrapLayer = (await import(bootstrap)).default as BootstrapLayer<any>;
      return new BootLayer(bootstrapLayer, this.loadedModules);
    }
  }

  private async createPersistenceLayer(): Promise<PersistenceLayer<any>> {
    const persistence = this.cmsConfig.layers.persistence;

    if (persistence && persistence.startsWith('@')) {
      // Load from named module
      const moduleName = persistence.slice(1);
      const module = this.getNamedModule(moduleName);

      if (!module.layers.persistence) {
        throw new Error(`Module "${moduleName}" do not provide persistence layer`);
      }

      const moduleConfig = this.cmsConfig.config.modules[moduleName];
      return new module.layers.persistence(moduleConfig);
    } else if (persistence) {
      // Load from the file
      return (await import(persistence)).default as PersistenceLayer<any>;
    } else {
      // Find any available persistence layer
      for (const moduleName in this.cmsConfig.config.modules) {
        if (this.modules.has(moduleName)) {
          const module = this.getNamedModule(moduleName);
          if (module.layers.persistence) {
            const moduleConfig = this.cmsConfig.config.modules[moduleName];
            return new module.layers.persistence(moduleConfig);
          }
        }
      }

      throw Error('Cannon find available persistence layer');
    }
  }

  private getNamedModule(moduleName: string): Module<any, any> {
    const module = this.modules.get(moduleName);

    if (!module) {
      throw new Error(`Unknown module: "${moduleName}"`);
    }

    return module;
  }
}
