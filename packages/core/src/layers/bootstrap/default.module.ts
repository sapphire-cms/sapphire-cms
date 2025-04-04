import {ContentLayer, DefaultContentLayer} from '../content';
import {BuildParams} from '../../common';
import {SapphireModule} from './module';
import {DefaultAdminLayer} from '../admin';

@SapphireModule({
  name: 'default',
  params: [] as const,
  layers: {
    content: DefaultContentLayer as unknown as new (params: BuildParams<readonly []>) => ContentLayer<BuildParams<readonly []>>,
    admin: DefaultAdminLayer,
  }
})
export class DefaultModule {
}
