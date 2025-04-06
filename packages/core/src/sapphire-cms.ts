import {ContentLayer} from './layers/content';
import {BootstrapLayer} from './layers/bootstrap';
import {PersistenceLayer} from './layers/persistence';
import {AdminLayer} from './layers/admin';
import {DI_TOKENS, isAfterInitAware, isAfterPortsBoundAware, isBeforeDestroyAware, Layer} from './kernel';
import {ManagementLayer} from './layers/management/management.layer';
import {container, InjectionToken} from 'tsyringe';
import {AdminService, ContentService, FieldTypeService} from './services';

const serviceTokens: InjectionToken<unknown>[] = [
    ContentService,
    FieldTypeService,
    AdminService,
];

export class SapphireCms {
  private readonly allLayers: Layer<any>[];

  constructor(bootstrapLayer: BootstrapLayer<any>,
              contentLayer: ContentLayer<any>,
              persistenceLayer: PersistenceLayer<any>,
              adminLayer: AdminLayer<any>,
              managementLayer: ManagementLayer<any>) {
    this.allLayers = [
        bootstrapLayer,
        contentLayer,
        persistenceLayer,
        adminLayer,
        managementLayer,
    ];

    // Register layers in DI container for injection
    container.register(DI_TOKENS.ContentLayer, { useValue: contentLayer });
    container.register(DI_TOKENS.BootstrapLayer, { useValue: bootstrapLayer });
    container.register(DI_TOKENS.PersistenceLayer, { useValue: persistenceLayer });
    container.register(DI_TOKENS.AdminLayer, { useValue: adminLayer });
    container.register(DI_TOKENS.ManagementLayer, { useValue: managementLayer });
  }

  public async run(): Promise<void> {
    console.log('Sapphire CMS is running');

    // Run after init hooks on layers
    const layersAfterInitPromises = this.allLayers
        .filter(isAfterInitAware)
        .map(layer => layer.afterInit());
    await Promise.all(layersAfterInitPromises);

    // Force service instantiation and port binding
    const servicesAfterInitPromises = serviceTokens
        .map(token => container.resolve(token))
        .filter(isAfterInitAware)
        .map(service => service.afterInit());
    await Promise.all(servicesAfterInitPromises);

    // TODO: move to admin service
    // this.adminLayer.installPackagesPort.accept(async packageNames => {
    //   await this.bootstrapLayer.installPackages(packageNames);
    // });

    // Bind all ports from layers
    const afterPortsBoundPromises = this.allLayers
        .filter(isAfterPortsBoundAware)
        .map(layer => layer.afterPortsBound());
    await Promise.all(afterPortsBoundPromises);

    // Run before destroy hooks
    const beforeDestroyPromises = this.allLayers
        .filter(isBeforeDestroyAware)
        .map(layer => layer.beforeDestroy());
    await Promise.all(beforeDestroyPromises);
  }
}
