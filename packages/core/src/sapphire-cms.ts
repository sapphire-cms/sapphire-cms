import { container, InjectionToken } from 'tsyringe';
import { AnyParams } from './common';
import {
  AfterInitAware,
  AfterPortsBoundAware,
  BeforeDestroyAware,
  DI_TOKENS,
  isAfterInitAware,
  isAfterPortsBoundAware,
  isBeforeDestroyAware,
  Layer,
} from './kernel';
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
    bootstrapLayer: BootstrapLayer<AnyParams>,
    persistenceLayer: PersistenceLayer<AnyParams>,
    adminLayer: AdminLayer<AnyParams>,
    managementLayer: ManagementLayer<AnyParams>,
    platformLayer: PlatformLayer<AnyParams>,
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

    // TODO: move to admin service
    // this.adminLayer.installPackagesPort.accept(async packageNames => {
    //   await this.bootstrapLayer.installPackages(packageNames);
    // });

    // Bind all ports from layers
    const afterPortsBoundPromises = this.allLayers
      .filter(isAfterPortsBoundAware)
      .map((layer) => (layer as AfterPortsBoundAware).afterPortsBound());
    await Promise.all(afterPortsBoundPromises);

    // Run before destroy hooks
    const beforeDestroyPromises = this.allLayers
      .filter(isBeforeDestroyAware)
      .map((layer) => (layer as BeforeDestroyAware).beforeDestroy());
    await Promise.all(beforeDestroyPromises);
  }
}
