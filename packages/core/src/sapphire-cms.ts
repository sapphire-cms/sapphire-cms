import {ContentLayer} from './layers/content';
import {BootstrapLayer} from './layers/bootstrap';
import {PersistenceLayer} from './layers/persistence';
import {AdminLayer} from './layers/admin';
import {isAfterInit} from './kernel/after-init';

export class SapphireCms {
  constructor(private readonly bootstrapLayer: BootstrapLayer<any>,
              private readonly contentLayer: ContentLayer<any>,
              private readonly persistenceLayer: PersistenceLayer<any>,
              private readonly adminLayer: AdminLayer<any>) {
  }

  public async run(): Promise<void> {
    console.log('Sapphire CMS is running');

    this.adminLayer.installPackagesTask.accept(async packageNames => {
      await this.bootstrapLayer.installPackages(packageNames);
    });

    if (isAfterInit(this.contentLayer)) {
      await this.contentLayer.afterInit();
    }

    if (isAfterInit(this.bootstrapLayer)) {
      await this.bootstrapLayer.afterInit();
    }

    if (isAfterInit(this.persistenceLayer)) {
      await this.persistenceLayer.afterInit();
    }

    if (isAfterInit(this.adminLayer)) {
      await this.adminLayer.afterInit();
    }

    await this.adminLayer.onHalt;

    return Promise.resolve();
  }
}
