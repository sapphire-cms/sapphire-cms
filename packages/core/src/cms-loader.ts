import {AnyParams} from './common';
import {
  BaseLayerType,
  createModuleRef,
  isModuleRef,
  Layer,
  Layers,
  LayerType,
  ModuleReference,
  parseModuleRef,
  PluggableLayerType
} from './kernel';
import {
  AdminLayer,
  BootstrapLayer,
  ContentLayer,
  DefaultModule,
  DeliveryLayer,
  ManagementLayer,
  ModuleFactory,
  PersistenceLayer,
  PlatformLayer,
  RenderLayer,
  SapphireModuleClass,
} from './layers';
import {CmsBootstrapLayer} from './layers/bootstrap/cms-bootstrap-layer';
import {CmsConfig} from './loadables';
import {SapphireCms} from './sapphire-cms';
import {CmsContext} from './services';

const DEFAULT_MODULE = new ModuleFactory(DefaultModule).instance();

export class CmsLoader {
  private cmsConfig: CmsConfig | null = null;
  private loadedModules: SapphireModuleClass[] = [];
  private readonly moduleFactories = new Map<string, ModuleFactory>();

  public constructor(private readonly systemBootstrap: BootstrapLayer<AnyParams>) {
  }

  public async loadSapphireCms(): Promise<SapphireCms> {
    this.cmsConfig = await this.systemBootstrap.getCmsConfig();

    // Load modules
    this.loadedModules = await this.systemBootstrap.loadModules();
    for (const moduleClass of this.loadedModules) {
      const moduleFactory = new ModuleFactory(moduleClass);
      this.moduleFactories.set(moduleFactory.name, moduleFactory);
    }

    // TODO: create caching bootstrap layer
    const bootstrapLayer = await this.createBootstrapLayer();
    const persistenceLayer = await this.createBaseLayer<PersistenceLayer<AnyParams>>(BaseLayerType.PERSISTENCE);
    const adminLayer = await this.createBaseLayer<AdminLayer<AnyParams>>(BaseLayerType.ADMIN);
    const managementLayer = await this.createBaseLayer<ManagementLayer<AnyParams>>(BaseLayerType.MANAGEMENT);
    const platformLayer = await this.createBaseLayer<PlatformLayer<AnyParams>>(BaseLayerType.PLATFORM);

    const cmsContext = await this.loadCmsContext(bootstrapLayer);

    return new SapphireCms(
        bootstrapLayer,
        persistenceLayer,
        adminLayer,
        managementLayer,
        platformLayer,
        cmsContext,
    );
  }

  private async createBootstrapLayer(): Promise<BootstrapLayer<AnyParams>> {
    const bootstrap = this.cmsConfig!.layers.bootstrap;
    let bootstrapLayer: BootstrapLayer<AnyParams>;

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
      bootstrapLayer = (await import(bootstrap)).default as BootstrapLayer<AnyParams>;
    }

    return new CmsBootstrapLayer(bootstrapLayer, this.cmsConfig!, this.loadedModules);
  }

  private async createBaseLayer<L extends Layer<AnyParams>>(layerType: BaseLayerType): Promise<L> {
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

  private createPluggableLayers<L extends Layer<AnyParams>>(layerType: PluggableLayerType): Map<ModuleReference, L> {
    const allLayers = new Map<ModuleReference, L>();

    // Check default module for the layer
    const defaultLayer: L | undefined = DEFAULT_MODULE.getLayer<L>(layerType);
    if (defaultLayer) {
      allLayers.set(createModuleRef('default'), defaultLayer);
    }

    for (const moduleFactory of this.moduleFactories.values()) {
      if (moduleFactory.providesLayer(layerType)) {
        const ref = createModuleRef(moduleFactory.name);
        const layer: L = this.getLayerFromModule(moduleFactory, layerType);
        allLayers.set(ref, layer);
      }
    }

    return allLayers;
  }

  private getLayerFromModule<L extends Layer<AnyParams>>(moduleFactory: ModuleFactory, layer: LayerType): L {
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

  private async loadCmsContext(bootstrapLayer: BootstrapLayer<AnyParams>): Promise<CmsContext> {
    const contentLayers = this.createPluggableLayers<ContentLayer<AnyParams>>(PluggableLayerType.CONTENT);
    const renderLayers = this.createPluggableLayers<RenderLayer<AnyParams>>(PluggableLayerType.RENDER);
    const deliveryLayers = this.createPluggableLayers<DeliveryLayer<AnyParams>>(PluggableLayerType.DELIVERY);

    const contentSchemas = await bootstrapLayer.getContentSchemas();
    const pipelineSchemas = await  bootstrapLayer.getPipelineSchemas();

    return new CmsContext(
        contentLayers,
        renderLayers,
        deliveryLayers,
        contentSchemas,
        pipelineSchemas,
    );
  }
}
