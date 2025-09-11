import { failure, Outcome, Program, program, success, SyncOutcome } from 'defectless';
import { AnyParams, interpolate } from './common';
import {
  BaseLayerType,
  BootstrapError,
  CmsConfig,
  createModuleRef,
  Env,
  isModuleRef,
  Layer,
  Layers,
  LayerType,
  ModuleConfig,
  ModuleReference,
  parseModuleRef,
  PlatformError,
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
  SecurityLayer,
} from './layers';
import { CmsBootstrapLayer } from './layers/bootstrap/cms-bootstrap-layer';
import { SapphireCms } from './sapphire-cms';
import { CmsContext } from './services';

const DEFAULT_MODULE = new ModuleFactory(DefaultModule).instance();

export const _interpolateModulesConfig = Symbol('_interpolateModulesConfig');

export type ModulesConfigMap = Record<
  string,
  Record<string, string | number | boolean | Array<string | number | boolean>>
>;

export class CmsLoader {
  public readonly usedModules = new Set<string>();
  private cmsConfig: CmsConfig | null = null;
  private modulesConfigMap: ModulesConfigMap | null = null;
  private loadedModules: SapphireModuleClass[] = [];
  private readonly moduleFactories = new Map<string, ModuleFactory>();

  constructor(private readonly systemBootstrap: BootstrapLayer<AnyParams>) {}

  public loadSapphireCms(): Outcome<SapphireCms, BootstrapError | PlatformError> {
    return program(function* (): Program<SapphireCms, BootstrapError | PlatformError> {
      this.cmsConfig = yield this.systemBootstrap.getCmsConfig();
      this.modulesConfigMap = CmsLoader.modulesConfigToMap(this.cmsConfig!.config.modules);

      // Load modules
      this.loadedModules = yield this.systemBootstrap.loadModules();
      for (const moduleClass of this.loadedModules) {
        const moduleFactory = new ModuleFactory(moduleClass);
        this.moduleFactories.set(moduleFactory.name, moduleFactory);
      }

      // Platform should be created first to fetch the environment
      const platformLayer: PlatformLayer<AnyParams> = yield this.createBaseLayer<
        PlatformLayer<AnyParams>
      >(BaseLayerType.PLATFORM);

      const env: Env = yield platformLayer.getEnv();
      this.modulesConfigMap = CmsLoader[_interpolateModulesConfig](this.modulesConfigMap, env);

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
      const securityLayer: SecurityLayer<unknown, AnyParams> = yield this.createBaseLayer<
        SecurityLayer<undefined, AnyParams>
      >(BaseLayerType.SECURITY);

      const cmsContext: CmsContext = yield this.loadCmsContext(bootstrapLayer);

      return new SapphireCms(
        platformLayer,
        bootstrapLayer,
        adminLayer,
        persistenceLayer,
        managementLayer,
        securityLayer,
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

      this.usedModules.add(moduleName);
    } else {
      // Load from the file
      // TODO: think how to track layers loaded from the file to add them in bundle
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

      this.usedModules.add(moduleName);

      return this.getLayerFromModule<L>(moduleFactory, layerType);
    } else if (configLayer) {
      // Load from the file
      // TODO: think how to track layers loaded from the file to add them in bundle
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
          if (this.modulesConfigMap![moduleFactory.name] || !moduleFactory.hasRequiredParams) {
            this.usedModules.add(moduleFactory.name);
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
        this.usedModules.add(moduleFactory.name);
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

    const moduleConfig = this.modulesConfigMap![moduleFactory.name];
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

  private static modulesConfigToMap(modules: ModuleConfig[]): ModulesConfigMap {
    const map: ModulesConfigMap = {};

    for (const moduleConfig of modules) {
      map[moduleConfig.module] = moduleConfig.config;
    }

    return map;
  }

  private static [_interpolateModulesConfig](
    configMap: ModulesConfigMap,
    env: Env,
  ): ModulesConfigMap {
    const clone: ModulesConfigMap = {};

    const context = { env };

    for (const [moduleName, moduleConfig] of Object.entries(configMap)) {
      clone[moduleName] = {};

      for (const [key, value] of Object.entries(moduleConfig)) {
        if (typeof value === 'string') {
          clone[moduleName][key] = interpolate(value, context);
        } else if (Array.isArray(value)) {
          clone[moduleName][key] = value.map((item) =>
            typeof item === 'string' ? interpolate(item, context) : item,
          );
        } else {
          clone[moduleName][key] = value;
        }
      }
    }

    return clone;
  }
}
