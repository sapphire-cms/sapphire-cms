import { DefaultAdminLayer } from '../admin';
import { DefaultContentLayer } from '../content';
import { NoneMediaLayer } from '../media/none-media.layer';
import { NoneBackupLayer } from '../persistence';
import { DefaultRenderLayer } from '../render';
import { NoneSecurityLayer } from '../security';
import { SapphireModule } from './module';

@SapphireModule({
  name: 'default',
  params: [] as const,
  layers: {
    content: DefaultContentLayer,
    admin: DefaultAdminLayer,
    render: DefaultRenderLayer,
    security: NoneSecurityLayer,
    persistence: NoneBackupLayer,
    media: NoneMediaLayer,
  },
})
export class DefaultModule {}
