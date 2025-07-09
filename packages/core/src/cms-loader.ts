import { failure, Outcome, Program, program, success, SyncOutcome } from 'defectless';
import { AnyParams } from './common';
import {
  BaseLayerType,
  BootstrapError,
  CmsConfig,
  createModuleRef,
  isModuleRef,
  Layer,
  Layers,
  LayerType,
  ModuleReference,
  parseModuleRef,
  PluggableLayerType,
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
import { CmsBootstrapLayer } from './layers/bootstrap/cms-bootstrap-layer';
import { SapphireCms } from './sapphire-cms';
import { CmsContext } from './services';

const DEFAULT_MODULE = new ModuleFactory(DefaultModule).instance();

export class CmsLoader {
  private cmsConfig: CmsConfig | null = null;
  private loadedModules: SapphireModuleClass[] = [];
  private readonly moduleFactories = new Map<string, ModuleFactory>();

  constructor(private readonly systemBootstrap: BootstrapLayer<AnyParams>) {}

  public loadSapphireCms(): Outcome<SapphireCms, BootstrapError> {
    return program(function* (): Program<SapphireCms, BootstrapError> {
      this.cmsConfig = yield this.systemBootstrap.getCmsConfig();

      // Load modules
      this.loadedModules = yield this.systemBootstrap.loadModules();
      for (const moduleClass of this.loadedModules) {
        const moduleFactory = new ModuleFactory(moduleClass);
        this.moduleFactories.set(moduleFactory.name, moduleFactory);
      }

      const bootstrapLayer: BootstrapLayer<AnyParams> = yield this.createBootstrapLayer();
      const persistenceLayer: PersistenceLayer<AnyParams> = yield this.createBaseLayer<
        PersistenceLayer<AnyParams>
      >(BaseLayerType.PERSISTENCE);
      const adminLayer: AdminLayer<AnyParams> = yield this.createBaseLayer<AdminLayer<AnyParams>>(
        BaseLayerType.ADMIN,
      );
      const managementLayer: ManagementLayer<AnyParams> = yield this.createBaseLayer<
        ManagementLayer<AnyParams>
      >(BaseLayerType.MANAGEMENT);
      const platformLayer: PlatformLayer<AnyParams> = yield this.createBaseLayer<
        PlatformLayer<AnyParams>
      >(BaseLayerType.PLATFORM);

      const cmsContext: CmsContext = yield this.loadCmsContext(bootstrapLayer);

      return new SapphireCms(
        platformLayer,
        adminLayer,
        bootstrapLayer,
        persistenceLayer,
        managementLayer,
        cmsContext,
      );
    }, this);
  }

  private createBootstrapLayer(): Outcome<BootstrapLayer<AnyParams>, BootstrapError> {
    const bootstrap = this.cmsConfig!.layers.bootstrap;
    let bootstrapLayer: Outcome<BootstrapLayer<AnyParams>, BootstrapError>;

    if (!bootstrap) {
      bootstrapLayer = success(this.systemBootstrap);
    } else if (isModuleRef(bootstrap)) {
      // Load from named module
      const moduleName = parseModuleRef(bootstrap)[0];
      const moduleFactory = this.moduleFactories.get(moduleName);
      if (!moduleFactory) {
        return failure(new BootstrapError(`Unknown module: "${moduleName}"`));
      }

      bootstrapLayer = this.getLayerFromModule<BootstrapLayer<AnyParams>>(
        moduleFactory,
        Layers.BOOTSTRAP,
      );
    } else {
      // Load from the file
      bootstrapLayer = Outcome.fromSupplier(
        () => import(bootstrap),
        (err) => new BootstrapError(`Failed to load bootstrap layer from file ${bootstrap}`, err),
      ).map((loaded) => loaded.default as BootstrapLayer<AnyParams>);
    }

    return bootstrapLayer.map(
      (bootstrapLayer) =>
        new CmsBootstrapLayer(
          bootstrapLayer,
          this.cmsConfig!,
          this.loadedModules,
        ) as unknown as BootstrapLayer<AnyParams>,
    );
  }

  private createBaseLayer<L extends Layer<AnyParams>>(
    layerType: BaseLayerType,
  ): Outcome<L, BootstrapError> {
    const configLayer = this.cmsConfig!.layers[layerType];

    if (configLayer && isModuleRef(configLayer)) {
      // Load from named module
      const moduleName = parseModuleRef(configLayer)[0];
      const moduleFactory = this.moduleFactories.get(moduleName);
      if (!moduleFactory) {
        return failure(new BootstrapError(`Unknown module: "${moduleName}"`));
      }

      return this.getLayerFromModule<L>(moduleFactory, layerType);
    } else if (configLayer) {
      // Load from the file
      return Outcome.fromSupplier(
        () => import(configLayer),
        (err) =>
          new BootstrapError(
            `Failed to load ${layerType} layer from module file ${configLayer}`,
            err,
          ),
      ).map((layer) => layer as L);
    } else {
      // Find any available layer of required type
      for (const moduleFactory of this.moduleFactories.values()) {
        if (moduleFactory.providesLayer(layerType)) {
          if (
            this.cmsConfig?.config.modules[moduleFactory.name] ||
            !moduleFactory.hasRequiredParams
          ) {
            return this.getLayerFromModule<L>(moduleFactory, layerType);
          }
        }
      }

      // Check default module for the layer
      const defaultLayer: L | undefined = DEFAULT_MODULE.getLayer<L>(layerType);
      if (defaultLayer) {
        return success(defaultLayer);
      }

      return failure(new BootstrapError(`Cannon find available ${layerType} layer`));
    }
  }

  private createPluggableLayers<L extends Layer<AnyParams>>(
    layerType: PluggableLayerType,
  ): Map<ModuleReference, L> {
    const allLayers = new Map<ModuleReference, L>();

    // Check default module for the layer
    const defaultLayer: L | undefined = DEFAULT_MODULE.getLayer<L>(layerType);
    if (defaultLayer) {
      allLayers.set(createModuleRef('default'), defaultLayer);
    }

    for (const moduleFactory of this.moduleFactories.values()) {
      if (moduleFactory.providesLayer(layerType)) {
        const ref = createModuleRef(moduleFactory.name);
        this.getLayerFromModule<L>(moduleFactory, layerType).matchSync(
          (layer) => {
            allLayers.set(ref, layer);
          },
          (err) =>
            console.warn(
              `Failed to instantiate ${layerType} layer from module ${moduleFactory.name}`,
              err,
            ),
          (defect) => {
            console.error(defect);
          },
        );
      }
    }

    return allLayers;
  }

  private getLayerFromModule<L extends Layer<AnyParams>>(
    moduleFactory: ModuleFactory,
    layerType: LayerType,
  ): SyncOutcome<L, BootstrapError> {
    if (!moduleFactory.providesLayer(layerType)) {
      return failure(
        new BootstrapError(`Module ${moduleFactory.name} doesn't provide ${layerType} layer`),
      );
    }

    const moduleConfig = this.cmsConfig?.config.modules[moduleFactory.name];
    if (!moduleConfig && moduleFactory.hasRequiredParams) {
      return failure(
        new BootstrapError(`Configuration for module ${moduleFactory.name} is missing`),
      );
    }

    return Outcome.fromFunction(
      (moduleConfig, layerType) => {
        const module = moduleFactory.instance(moduleConfig);
        return module.getLayer<L>(layerType)!;
      },
      (err) =>
        new BootstrapError(
          `Failed to get ${layerType} layer from module ${moduleFactory.name}`,
          err,
        ),
    )(moduleConfig, layerType);
  }

  private loadCmsContext(
    bootstrapLayer: BootstrapLayer<AnyParams>,
  ): Outcome<CmsContext, BootstrapError> {
    const contentLayers = this.createPluggableLayers<ContentLayer<AnyParams>>(
      PluggableLayerType.CONTENT,
    );
    const renderLayers = this.createPluggableLayers<RenderLayer<AnyParams>>(
      PluggableLayerType.RENDER,
    );
    const deliveryLayers = this.createPluggableLayers<DeliveryLayer<AnyParams>>(
      PluggableLayerType.DELIVERY,
    );

    return Outcome.all([bootstrapLayer.getContentSchemas(), bootstrapLayer.getPipelineSchemas()])
      .map(
        ([contentSchemas, pipelineSchemas]) =>
          new CmsContext(
            contentLayers,
            renderLayers,
            deliveryLayers,
            contentSchemas,
            pipelineSchemas,
          ),
      )
      .mapFailure((errors) => {
        const message = errors
          .filter((error) => !!error)
          .map((error) => error?.message)
          .join('\n');
        return new BootstrapError(message);
      });
  }
}
