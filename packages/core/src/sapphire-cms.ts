import {ContentLayer} from './layers/content';
import {BootstrapLayer} from './layers/bootstrap';
import {PersistenceLayer} from './layers/persistence';

export class SapphireCms {
  constructor(private readonly bootstrapLayer: BootstrapLayer<any>,
              private readonly contentLayer: ContentLayer<any>,
              private readonly persistenceLayer: PersistenceLayer<any>) {
  }

  public run(): Promise<void> {
    console.log('Sapphire CMS is running');

    // TODO: just to make compile work
    console.log(this.contentLayer);
    console.log(this.bootstrapLayer);
    console.log(this.persistenceLayer);

    return Promise.resolve();
  }
}
