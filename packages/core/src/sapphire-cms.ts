import {ContentLayer} from './layers/content';
import {BootstrapLayer} from './layers/bootstrap';
import {PersistenceLayer} from './layers/persistence';
import {AdminLayer} from './layers/admin';

export class SapphireCms {
  constructor(private readonly bootstrapLayer: BootstrapLayer<any>,
              private readonly contentLayer: ContentLayer<any>,
              private readonly persistenceLayer: PersistenceLayer<any>,
              private readonly adminLayer: AdminLayer<any>) {
  }

  public async run(): Promise<void> {
    console.log('Sapphire CMS is running');

    // TODO: just to make compile work
    console.log(this.contentLayer);
    console.log(this.bootstrapLayer);
    console.log(this.persistenceLayer);

    this.adminLayer.installPackagesTask.accept(async packageNames => {
      console.log('Requested install packages');
      console.log(packageNames);
    });

    if (this.adminLayer.afterInit) {
      await this.adminLayer.afterInit();
    }

    await this.adminLayer.onHalt;

    return Promise.resolve();
  }
}
