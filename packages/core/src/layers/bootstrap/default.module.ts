import {ContentLayer, DefaultContentLayer} from '../content';
import {BuildParams} from '../../common';
import {SapphireModule} from './module';

@SapphireModule({
  name: 'default',
  params: [] as const,
  layers: {
    content: DefaultContentLayer as unknown as new (params: BuildParams<readonly []>) => ContentLayer<BuildParams<readonly []>>,
  }
})
export class DefaultModule {
}
