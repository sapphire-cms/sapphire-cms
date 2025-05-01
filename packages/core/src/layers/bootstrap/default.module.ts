import {DefaultAdminLayer} from '../admin';
import {DefaultContentLayer} from '../content';
import {DefaultRenderLayer} from '../render';
import {SapphireModule} from './module';

@SapphireModule({
  name: 'default',
  params: [] as const,
  layers: {
    content: DefaultContentLayer,
    admin: DefaultAdminLayer,
    render: DefaultRenderLayer,
  }
})
export class DefaultModule {
}
