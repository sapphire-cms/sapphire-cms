import {BootstrapLayer, DefaultModule, getModuleMetadata, SapphireModuleClass} from './layers/bootstrap';
import {SapphireCms} from './sapphire-cms';
import {CmsConfig} from './loadables';
import {ContentLayer} from './layers/content';
import {CmsBootstrapLayer} from './layers/bootstrap/cms-bootstrap-layer';
import {PersistenceLayer} from './layers/persistence';
import {AdminLayer} from './layers/admin';

export class CmsLoader {
  private cmsConfig: CmsConfig | null = null;
  private loadedModules: SapphireModuleClass<any, any>[] = [];
  private readonly moduleMap = new Map<string, SapphireModuleClass<any, any>>();

  public constructor(private readonly systemBootstrap: BootstrapLayer<any>) {
  }

  public async loadSapphireCms(): Promise<SapphireCms> {
    this.cmsConfig = await this.systemBootstrap.getCmsConfig();
    this.loadedModules = await this.systemBootstrap.loadModules();

    for (const module of this.loadedModules) {
      const metadata = getModuleMetadata(module);
      this.moduleMap.set(metadata!.name, module);
    }

    const contentLayer = this.createContentLayer();
    const boostrapLayer = await this.createBootstrapLayer();
    const persistenceLayer = await this.createPersistenceLayer();
    const adminLayer = await this.createAdminLayer();

    return new SapphireCms(boostrapLayer, contentLayer, persistenceLayer, adminLayer);
  }

  private createContentLayer(): ContentLayer<any> {
    // TODO: code the merge of content layers
    const metadata = getModuleMetadata(DefaultModule);
    return metadata!.layers.content as ContentLayer<any>;
  }

  private async createBootstrapLayer(): Promise<BootstrapLayer<any>> {
    const bootstrap = this.cmsConfig!.layers.bootstrap;
    let bootstrapLayer: BootstrapLayer<any>;

    if (!bootstrap) {
      bootstrapLayer = this.systemBootstrap;
    } else if (bootstrap.startsWith('@')) {
      // Load from named module
      const moduleName = bootstrap.slice(1);
      const module = this.getNamedModule(moduleName);
      const metadata = getModuleMetadata(module);

      if (!metadata?.layers.bootstrap) {
        throw new Error(`Module "${moduleName}" do not provide bootstrap layer`);
      }

      const moduleConfig = this.cmsConfig!.config.modules[moduleName];
      bootstrapLayer = new metadata!.layers.bootstrap(moduleConfig);
    } else {
      // Load from the file
      bootstrapLayer = (await import(bootstrap)).default as BootstrapLayer<any>;
    }

    return new CmsBootstrapLayer(bootstrapLayer, this.cmsConfig!, this.loadedModules);
  }

  private async createPersistenceLayer(): Promise<PersistenceLayer<any>> {
    const persistence = this.cmsConfig!.layers.persistence;

    if (persistence && persistence.startsWith('@')) {
      // Load from named module
      const moduleName = persistence.slice(1);
      const module = this.getNamedModule(moduleName);
      const metadata = getModuleMetadata(module);

      if (!metadata?.layers.persistence) {
        throw new Error(`Module "${moduleName}" do not provide persistence layer`);
      }

      const moduleConfig = this.cmsConfig!.config.modules[moduleName];
      return new metadata!.layers.persistence(moduleConfig);
    } else if (persistence) {
      // Load from the file
      return (await import(persistence)).default as PersistenceLayer<any>;
    } else {
      // Find any available persistence layer
      for (const moduleName in this.cmsConfig!.config.modules) {
        if (this.moduleMap.has(moduleName)) {
          const module = this.getNamedModule(moduleName);
          const metadata = getModuleMetadata(module);

          if (metadata?.layers.persistence) {
            const moduleConfig = this.cmsConfig!.config.modules[moduleName];
            return new metadata!.layers.persistence(moduleConfig);
          }
        }
      }

      throw Error('Cannon find available persistence layer');
    }
  }

  private async createAdminLayer(): Promise<AdminLayer<any>> {
    const admin = this.cmsConfig!.layers.admin;

    if (admin && admin.startsWith('@')) {
      // Load from named module
      const moduleName = admin.slice(1);
      const module = this.getNamedModule(moduleName);
      const metadata = getModuleMetadata(module);

      if (!metadata?.layers.admin) {
        throw new Error(`Module "${moduleName}" do not provide admin layer`);
      }

      const moduleConfig = this.cmsConfig!.config.modules[moduleName];
      return new metadata!.layers.admin!(moduleConfig);
    } else if (admin) {
      // Load from the file
      return (await import(admin)).default as AdminLayer<any>;
    } else {
      // Find any available admin layer
      for (const moduleName in this.cmsConfig!.config.modules) {
        if (this.moduleMap.has(moduleName)) {
          const module = this.getNamedModule(moduleName);
          const metadata = getModuleMetadata(module);

          if (metadata?.layers.admin) {
            const moduleConfig = this.cmsConfig!.config.modules[moduleName];
            return new metadata!.layers.admin(moduleConfig);
          }
        }
      }

      const metadata = getModuleMetadata(DefaultModule);
      return new metadata!.layers.admin!(null)!;
    }
  }

  private getNamedModule(moduleName: string): SapphireModuleClass<any, any> {
    const module = this.moduleMap.get(moduleName);

    if (!module) {
      throw new Error(`Unknown module: "${moduleName}"`);
    }

    return module;
  }
}
