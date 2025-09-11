import { failure, Outcome, Program, program } from 'defectless';
import { container, InjectionToken } from 'tsyringe';
import { AnyParams } from './common';
import {
  AfterInitAware,
  AfterPortsBoundAware,
  BeforeDestroyAware,
  CoreCmsError,
  DI_TOKENS,
  Frameworks,
  HttpLayer,
  isAfterInitAware,
  isAfterPortsBoundAware,
  isBeforeDestroyAware,
  isHttpLayer,
  Layer,
  PlatformError,
  PortError,
} from './kernel';
import {
  AdminLayer,
  BootstrapLayer,
  ManagementLayer,
  PersistenceLayer,
  PlatformLayer,
  SecurityLayer,
} from './layers';
import { AdminService, CmsContext, ContentService, SecureAdminLayer } from './services';
import { DocumentValidationService } from './services/document-validation.service';
import { RenderService } from './services/render.service';

const serviceTokens: InjectionToken<unknown>[] = [
  RenderService,
  DocumentValidationService,
  ContentService,
  AdminService,
];

export class SapphireCms {
  private readonly allLayers: Layer<AnyParams>[];

  constructor(
    public readonly platformLayer: PlatformLayer<AnyParams>,
    private readonly bootstrapLayer: BootstrapLayer<AnyParams>,
    adminLayer: AdminLayer<AnyParams>,
    persistenceLayer: PersistenceLayer<AnyParams>,
    managementLayer: ManagementLayer<AnyParams>,
    securityLayer: SecurityLayer<unknown, AnyParams>,
    cmsContext: CmsContext,
  ) {
    this.allLayers = [
      bootstrapLayer,
      persistenceLayer,
      adminLayer,
      managementLayer,
      platformLayer,
      securityLayer,
      ...cmsContext.contentLayers.values(),
      ...cmsContext.renderLayers.values(),
      ...cmsContext.deliveryLayers.values(),
    ];

    // Register layers in DI container for injection
    container.register(DI_TOKENS.BootstrapLayer, { useValue: bootstrapLayer });
    container.register(DI_TOKENS.PersistenceLayer, { useValue: persistenceLayer });
    container.register(DI_TOKENS.AdminLayer, { useValue: adminLayer });
    container.register(DI_TOKENS.ManagementLayer, { useValue: managementLayer });
    container.register(DI_TOKENS.PlatformLayer, { useValue: platformLayer });
    container.register(DI_TOKENS.SecurityLayer, { useValue: securityLayer });

    container.register(CmsContext, { useValue: cmsContext });
  }

  public run(): Outcome<void, CoreCmsError | PlatformError | PortError> {
    return program(function* (): Program<void, CoreCmsError | PlatformError | PortError> {
      // Add Http layers as controllers to platform
      yield this.setControllers();

      // Add static web modules to platform
      yield this.setWebModules();

      // Run after init hooks on layers
      yield this.runAfterInitHooks();

      // Force service instantiation and port binding
      yield this.instantiateServices();

      // Bind all ports from layers
      yield this.runAfterPortsBoundHooks();

      // Start platform
      yield this.platformLayer.start();

      return this.listenOnHaltEvent();
    }, this);
  }

  /**
   * Add Http layers as controllers to platform.
   */
  private setControllers(): Outcome<void, CoreCmsError> {
    return program(function* (): Program<void, CoreCmsError> {
      for (const [key, token] of Object.entries(DI_TOKENS)) {
        const layer = container.resolve(token);
        if (isHttpLayer(layer)) {
          if (SapphireCms.isHttpLayerCompatible(layer, this.platformLayer)) {
            if (layer.framework != Frameworks.NONE) {
              this.platformLayer.addRestController(layer);
            }
          } else {
            const reason = `${key} is incompatible with platform.
            ${key} uses HTTP framework ${layer.framework}.
            Platforms supports frameworks: ${this.platformLayer.supportedFrameworks.join(', ')}.`;
            yield failure(new CoreCmsError(reason));
          }
        }
      }
    }, this);
  }

  private setWebModules(): Outcome<void, CoreCmsError> {
    return this.bootstrapLayer
      .getWebModules()
      .map((webModules) => {
        webModules.forEach((webModule) => this.platformLayer.addWebModule(webModule));
      })
      .mapFailure((error) => new CoreCmsError('Failed to set Web Modules.', error));
  }

  private runAfterInitHooks(): Outcome<void, CoreCmsError> {
    const tasks = this.allLayers
      .filter(isAfterInitAware)
      .map((layer) => (layer as AfterInitAware).afterInit());

    return Outcome.all(tasks)
      .map(() => {})
      .mapFailure(SapphireCms.concatErrors);
  }

  private runAfterPortsBoundHooks(): Outcome<void, CoreCmsError> {
    const tasks = this.allLayers
      .filter(isAfterPortsBoundAware)
      .map((layer) => (layer as AfterPortsBoundAware).afterPortsBound());

    return Outcome.all(tasks)
      .map(() => {})
      .mapFailure(SapphireCms.concatErrors);
  }

  private instantiateServices(): Outcome<void, CoreCmsError> {
    const tasks = serviceTokens
      .map((token) => container.resolve(token))
      .filter(isAfterInitAware)
      .map((service) => service.afterInit());

    return Outcome.all(tasks)
      .map(() => {})
      .mapFailure(SapphireCms.concatErrors);
  }

  private listenOnHaltEvent(): Outcome<void, PortError> {
    const adminLayer = container.resolve(SecureAdminLayer);

    return adminLayer.haltPort.accept(() => {
      // Run before destroy hooks
      const beforeDestroyOutcomes = this.allLayers
        .filter(isBeforeDestroyAware)
        .map((layer) => (layer as BeforeDestroyAware).beforeDestroy())
        .map((promise) =>
          Outcome.fromSupplier(
            () => promise,
            (err) => new CoreCmsError('beforeDestroy method failed', err),
          ),
        );

      return Outcome.all(beforeDestroyOutcomes)
        .map(() => undefined)
        .finally(() =>
          Outcome.fromSupplier(
            () => this.platformLayer.halt(),
            (err) => new PlatformError('Failed to halt platform', err),
          ),
        )
        .mapFailure(() => undefined as never);
    });
  }

  private static isHttpLayerCompatible(
    httpLayer: HttpLayer,
    platform: PlatformLayer<AnyParams>,
  ): boolean {
    if (httpLayer.framework === Frameworks.NONE) {
      return true;
    }

    return platform.supportedFrameworks.includes(httpLayer.framework);
  }

  private static concatErrors(errors: unknown[]): CoreCmsError {
    const message = errors
      .filter((error) => !!error)
      .map((error) => String(error))
      .join('\n');
    return new CoreCmsError(message);
  }
}
