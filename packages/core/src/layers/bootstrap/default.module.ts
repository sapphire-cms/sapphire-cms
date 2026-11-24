import { DEFAULT_MODULE_NAME } from '../../kernel';
import { NoneAdminLayer } from '../admin';
import { DefaultContentLayer } from '../content';
import { NoneManagementLayer } from '../management';
import { NoneMediaLayer } from '../media/none-media.layer';
import { NoneBackupLayer } from '../persistence';
import { NonePublicLayer } from '../public';
import { DefaultRenderLayer } from '../render';
import { NoneSecurityLayer } from '../security';
import { DocumentShaper, ShaperLayer } from '../shaper';
import { SapphireModule } from './module';

export class DefaultShaperLayer implements ShaperLayer {
  public readonly fieldShaperFactories = [];
  public readonly documentShapers = new Map<string, DocumentShaper>();
}

@SapphireModule({
  name: DEFAULT_MODULE_NAME,
  params: [] as const,
  layers: {
    content: DefaultContentLayer,
    admin: NoneAdminLayer,
    management: NoneManagementLayer,
    render: DefaultRenderLayer,
    security: NoneSecurityLayer,
    persistence: NoneBackupLayer,
    media: NoneMediaLayer,
    public: NonePublicLayer,
    shaper: DefaultShaperLayer,
  },
})
export class DefaultModule {}
