import { Outcome } from 'defectless';
import { container, InjectionToken } from 'tsyringe';
import { AnyParams } from './common';
import {
  AfterInitAware,
  AfterPortsBoundAware,
  BeforeDestroyAware,
  DI_TOKENS,
  Frameworks,
  isAfterInitAware,
  isAfterPortsBoundAware,
  isBeforeDestroyAware,
  Layer,
  PlatformError,
} from './kernel';
import { HttpLayer, isHttpLayer } from './kernel/http-layer';
import {
  AdminLayer,
  BootstrapLayer,
  ManagementLayer,
  PersistenceLayer,
  PlatformLayer,
} from './layers';
import { AdminService, CmsContext, ContentService, FieldTypeService } from './services';
import { DocumentValidationService } from './services/document-validation.service';
import { RenderService } from './services/render.service';

const serviceTokens: InjectionToken<unknown>[] = [
  FieldTypeService,
  RenderService,
  DocumentValidationService,
  ContentService,
  AdminService,
];

export class SapphireCms {
  private readonly allLayers: Layer<AnyParams>[];

  constructor(
    private readonly platformLayer: PlatformLayer<AnyParams>,
    private readonly adminLayer: AdminLayer<AnyParams>,
    bootstrapLayer: BootstrapLayer<AnyParams>,
    persistenceLayer: PersistenceLayer<AnyParams>,
    managementLayer: ManagementLayer<AnyParams>,
    cmsContext: CmsContext,
  ) {
    this.allLayers = [
      bootstrapLayer,
      persistenceLayer,
      adminLayer,
      managementLayer,
      platformLayer,
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

    container.register(CmsContext, { useValue: cmsContext });
  }

  public async run(): Promise<void> {
    // Add Http layers as controllers to platform
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
          return Promise.reject(reason);
        }
      }
    }

    // Run after init hooks on layers
    const layersAfterInitPromises = this.allLayers
      .filter(isAfterInitAware)
      .map((layer) => (layer as AfterInitAware).afterInit());
    await Promise.all(layersAfterInitPromises);

    // Force service instantiation and port binding
    const servicesAfterInitPromises = serviceTokens
      .map((token) => container.resolve(token))
      .filter(isAfterInitAware)
      .map((service) => service.afterInit());
    await Promise.all(servicesAfterInitPromises);

    // Bind all ports from layers
    const afterPortsBoundPromises = this.allLayers
      .filter(isAfterPortsBoundAware)
      .map((layer) => (layer as AfterPortsBoundAware).afterPortsBound());
    await Promise.all(afterPortsBoundPromises);

    // Start platform
    await this.platformLayer.start();

    this.adminLayer.haltPort.accept(() => {
      // Run before destroy hooks
      const beforeDestroyOutcomes = this.allLayers
        .filter(isBeforeDestroyAware)
        .map((layer) => (layer as BeforeDestroyAware).beforeDestroy())
        .map((promise) =>
          Outcome.fromSupplier(
            () => promise,
            // TODO: create error CoreCmsError
            (err) => new PlatformError('beforeDestroy method failed', err),
          ),
        );

      return Outcome.all(beforeDestroyOutcomes)
        .map((_) => undefined)
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
}
