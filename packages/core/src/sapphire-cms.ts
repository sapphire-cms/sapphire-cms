import {ContentLayer} from './layers/content';
import {BootstrapLayer} from './layers/bootstrap';
import {PersistenceLayer} from './layers/persistence';
import {AdminLayer} from './layers/admin';
import {isAfterPortsBoundAware} from './kernel/after-ports-bound-aware';
import {isAfterInitAware, isBeforeDestroyAware, Layer} from './kernel';

export class SapphireCms {
  private readonly allLayers: Layer<any>[];

  constructor(private readonly bootstrapLayer: BootstrapLayer<any>,
              private readonly contentLayer: ContentLayer<any>,
              private readonly persistenceLayer: PersistenceLayer<any>,
              private readonly adminLayer: AdminLayer<any>) {
    this.allLayers = [
        bootstrapLayer,
        contentLayer,
        persistenceLayer,
        adminLayer,
    ];
  }

  public async run(): Promise<void> {
    console.log('Sapphire CMS is running');

    // TODO: just to avoid compilation errors:
    console.log(this.contentLayer);
    console.log(this.persistenceLayer);

    // Run after init hooks
    const afterInitPromises = this.allLayers
        .filter(isAfterInitAware)
        .map(layer => layer.afterInit());
    await Promise.all(afterInitPromises);

    // Bound ports
    this.adminLayer.installPackagesPort.accept(async packageNames => {
      await this.bootstrapLayer.installPackages(packageNames);
    });

    const afterPortsBoundPromises = this.allLayers
        .filter(isAfterPortsBoundAware)
        .map(layer => layer.afterPortsBound());
    await Promise.all(afterPortsBoundPromises);

    // Run before destroy hooks
    const beforeDestroyPromises = this.allLayers
        .filter(isBeforeDestroyAware)
        .map(layer => layer.beforeDestroy());
    await Promise.all(beforeDestroyPromises);

    return new Promise<void>(resolve => {
      this.adminLayer.haltPort.accept(async () => {
        resolve();
      })
    });
  }
}
