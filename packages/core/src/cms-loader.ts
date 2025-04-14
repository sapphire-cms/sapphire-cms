import {
  AdminLayer,
  BootstrapLayer,
  ContentLayer,
  DefaultModule, DeliveryLayer,
  getModuleMetadata,
  ManagementLayer, mergeRenderLayers,
  PersistenceLayer,
  PlatformLayer, RenderLayer,
  SapphireModuleClass
} from './layers';
import {SapphireCms} from './sapphire-cms';
import {CmsConfig} from './loadables';
import {CmsBootstrapLayer} from './layers/bootstrap/cms-bootstrap-layer';
import {BaseLayerType, Layer} from './kernel';

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
    // TODO: create caching bootstrap layer
    const bootstrapLayer = await this.createBootstrapLayer();
    const persistenceLayer = await this.createLayer<PersistenceLayer<any>>(BaseLayerType.PERSISTENCE);
    const adminLayer = await this.createLayer<AdminLayer<any>>(BaseLayerType.ADMIN);
    const managementLayer = await this.createLayer<ManagementLayer<any>>(BaseLayerType.MANAGEMENT);
    const platformLayer = await this.createLayer<PlatformLayer<any>>(BaseLayerType.PLATFORM);
    const renderLayer = this.createRenderLayer();
    const deliveryLayers = this.createDeliveryLayers();

    return new SapphireCms(
        bootstrapLayer,
        contentLayer,
        persistenceLayer,
        adminLayer,
        managementLayer,
        platformLayer,
        renderLayer,
        deliveryLayers,
    );
  }

  private createContentLayer(): ContentLayer<any> {
    // TODO: code the merge of content layers
    const metadata = getModuleMetadata(DefaultModule)!;
    return new metadata!.layers.content!({});
  }

  private createRenderLayer(): RenderLayer<any> {
    const defaultModuleMetadata = getModuleMetadata(DefaultModule)!;
    const defaultRenderLayer = new defaultModuleMetadata!.layers.render!({});

    const allRenderLayers: RenderLayer<any>[] = [ defaultRenderLayer ];

    for (const module of this.loadedModules) {
      const moduleMetadata = getModuleMetadata(module);

      if (moduleMetadata && moduleMetadata.layers.render) {
        const moduleConfig = this.cmsConfig!.config.modules[moduleMetadata.name] || {};
        const renderLayer = new moduleMetadata.layers.render(moduleConfig);
        allRenderLayers.push(renderLayer);
      }
    }

    return mergeRenderLayers(allRenderLayers);
  }

  private createDeliveryLayers(): Map<string, DeliveryLayer<any>> {
    const allDeliveryLayers = new Map<string, DeliveryLayer<any>>();

    for (const module of this.loadedModules) {
      const moduleMetadata = getModuleMetadata(module);

      if (moduleMetadata && moduleMetadata.layers.delivery) {
        const moduleConfig = this.cmsConfig!.config.modules[moduleMetadata.name] || {};
        const deliveryLayer = new moduleMetadata.layers.delivery(moduleConfig);
        allDeliveryLayers.set(moduleMetadata.name, deliveryLayer);
      }
    }

    return allDeliveryLayers;
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

  private async createLayer<T extends Layer<any>>(layerType: BaseLayerType): Promise<T> {
    const configLayer = this.cmsConfig!.layers[layerType];

    if (configLayer && configLayer.startsWith('@')) {
      // Load from named module
      const moduleName = configLayer.slice(1);
      const module = this.getNamedModule(moduleName);
      const metadata = getModuleMetadata(module);

      if (!metadata?.layers[layerType]) {
        throw new Error(`Module "${moduleName}" do not provide ${layerType} layer`);
      }

      const moduleConfig = this.cmsConfig!.config.modules[moduleName];
      return new (metadata!.layers[layerType] as unknown as new (params: any) => T)(moduleConfig) as T;
    } else if (configLayer) {
      // Load from the file
      return (await import(configLayer)).default as T;
    } else {
      // Find any available layer of required type
      for (const moduleName in this.cmsConfig!.config.modules) {
        if (this.moduleMap.has(moduleName)) {
          const module = this.getNamedModule(moduleName);
          const metadata = getModuleMetadata(module);

          if (metadata?.layers[layerType]) {
            const moduleConfig = this.cmsConfig!.config.modules[moduleName];
            return new (metadata!.layers[layerType] as unknown as new (params: any) => T)(moduleConfig) as T;
          }
        }
      }

      // Check default module for the layer
      const metadata = getModuleMetadata(DefaultModule);
      if (metadata?.layers[layerType]) {
        return new (metadata!.layers[layerType] as unknown as new (params: any) => T)(null as any) as T;
      }

      throw Error(`Cannon find available ${layerType} layer`);
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
