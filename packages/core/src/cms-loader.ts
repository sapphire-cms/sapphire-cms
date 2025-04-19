import {
  AdminLayer,
  BootstrapLayer,
  ContentLayer,
  DefaultModule,
  DeliveryLayer,
  ManagementLayer,
  mergeRenderLayers,
  ModuleFactory,
  PersistenceLayer,
  PlatformLayer,
  RenderLayer,
  SapphireModuleClass,
} from './layers';
import {SapphireCms} from './sapphire-cms';
import {CmsConfig} from './loadables';
import {CmsBootstrapLayer} from './layers/bootstrap/cms-bootstrap-layer';
import {BaseLayerType, isModuleRef, Layer, Layers, LayerType, parseModuleRef} from './kernel';

const DEFAULT_MODULE = new ModuleFactory(DefaultModule).instance(null);

export class CmsLoader {
  private cmsConfig: CmsConfig | null = null;
  private loadedModules: SapphireModuleClass<any, any>[] = [];
  private readonly moduleFactories = new Map<string, ModuleFactory>();

  public constructor(private readonly systemBootstrap: BootstrapLayer<any>) {
  }

  public async loadSapphireCms(): Promise<SapphireCms> {
    this.cmsConfig = await this.systemBootstrap.getCmsConfig();

    // Load modules
    this.loadedModules = await this.systemBootstrap.loadModules();
    for (const moduleClass of this.loadedModules) {
      const moduleFactory = new ModuleFactory(moduleClass);
      this.moduleFactories.set(moduleFactory.name, moduleFactory);
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
    return DEFAULT_MODULE.contentLayer!;
  }

  private createRenderLayer(): RenderLayer<any> {
    const allRenderLayers: RenderLayer<any>[] = [ DEFAULT_MODULE.renderLayer! ];

    for (const moduleFactory of this.moduleFactories.values()) {
      if (moduleFactory.providesLayer(Layers.RENDER)) {
        allRenderLayers.push(this.getLayerFromModule(moduleFactory, Layers.RENDER));
      }
    }

    return mergeRenderLayers(allRenderLayers);
  }

  private createDeliveryLayers(): Map<string, DeliveryLayer<any>> {
    const allDeliveryLayers = new Map<string, DeliveryLayer<any>>();

    for (const moduleFactory of this.moduleFactories.values()) {
      if (moduleFactory.providesLayer(Layers.DELIVERY)) {
        const deliveryLayer: DeliveryLayer<any> = this.getLayerFromModule(moduleFactory, Layers.DELIVERY);
        allDeliveryLayers.set(moduleFactory.name, deliveryLayer);
      }
    }

    return allDeliveryLayers;
  }

  private async createBootstrapLayer(): Promise<BootstrapLayer<any>> {
    const bootstrap = this.cmsConfig!.layers.bootstrap;
    let bootstrapLayer: BootstrapLayer<any>;

    if (!bootstrap) {
      bootstrapLayer = this.systemBootstrap;
    } else if (isModuleRef(bootstrap)) {
      // Load from named module
      const moduleName = parseModuleRef(bootstrap)[0];
      const moduleFactory = this.moduleFactories.get(moduleName);
      if (!moduleFactory) {
        throw new Error(`Unknown module: "${moduleName}"`);
      }

      bootstrapLayer = this.getLayerFromModule(moduleFactory, Layers.BOOTSTRAP);
    } else {
      // Load from the file
      bootstrapLayer = (await import(bootstrap)).default as BootstrapLayer<any>;
    }

    return new CmsBootstrapLayer(bootstrapLayer, this.cmsConfig!, this.loadedModules);
  }

  private async createLayer<L extends Layer<any>>(layerType: BaseLayerType): Promise<L> {
    const configLayer = this.cmsConfig!.layers[layerType];

    if (configLayer && isModuleRef(configLayer)) {
      // Load from named module
      const moduleName = parseModuleRef(configLayer)[0];
      const moduleFactory = this.moduleFactories.get(moduleName);
      if (!moduleFactory) {
        throw new Error(`Unknown module: "${moduleName}"`);
      }

      return this.getLayerFromModule<L>(moduleFactory, layerType)!;
    } else if (configLayer) {
      // Load from the file
      return (await import(configLayer)).default as L;
    } else {
      // Find any available layer of required type
      for (const moduleName in this.cmsConfig!.config.modules) {
        if (this.moduleFactories.has(moduleName)) {
          const moduleFactory = this.moduleFactories.get(moduleName);
          if (!moduleFactory) {
            throw new Error(`Unknown module: "${moduleName}"`);
          }

          if (moduleFactory.providesLayer(layerType)) {
            return this.getLayerFromModule<L>(moduleFactory, layerType)!;
          }
        }
      }

      // Check default module for the layer
      const defaultLayer: L | undefined = DEFAULT_MODULE.getLayer<L>(layerType);
      if (defaultLayer) {
        return defaultLayer;
      }

      throw Error(`Cannon find available ${layerType} layer`);
    }
  }

  private getLayerFromModule<L extends Layer<any>>(moduleFactory: ModuleFactory, layer: LayerType): L {
    if (!moduleFactory.providesLayer(layer)) {
      throw new Error(`Module ${moduleFactory.name} doesn't provide ${layer} layer`);
    }

    const moduleConfig = this.cmsConfig?.config.modules[moduleFactory.name];
    if (!moduleConfig) {
      throw new Error(`Configuration for module ${moduleFactory.name} is missing`);
    }

    const module = moduleFactory.instance(moduleConfig);
    return module.getLayer<L>(layer)!;
  }
}
