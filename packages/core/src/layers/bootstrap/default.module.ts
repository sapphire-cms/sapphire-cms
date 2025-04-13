import {ContentLayer, DefaultContentLayer} from '../content';
import {BuildParams} from '../../common';
import {SapphireModule} from './module';
import {DefaultAdminLayer} from '../admin';
import {RawRenderLayer} from '../render';

@SapphireModule({
  name: 'default',
  params: [] as const,
  layers: {
    content: DefaultContentLayer as unknown as new (params: BuildParams<readonly []>) => ContentLayer<BuildParams<readonly []>>,
    admin: DefaultAdminLayer,
    render: RawRenderLayer,
  }
})
export class DefaultModule {
}
