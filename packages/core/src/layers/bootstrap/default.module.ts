import {DefaultContentLayer} from '../content';
import {SapphireModule} from './module';
import {DefaultAdminLayer} from '../admin';
import {DefaultRenderLayer} from '../render';

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
