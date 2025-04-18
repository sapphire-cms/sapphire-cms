import {AfterPortsBoundAware, Layer, Port} from '../../kernel';
import {ContentSchema} from '../../common';

export interface AdminLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  installPackagesPort: Port<(packageNames: string[]) => Promise<void>>;
  removePackagesPort: Port<(packageNames: string[]) => Promise<void>>;

  getContentSchemasPort: Port<() => Promise<ContentSchema[]>>;

  haltPort: Port<() => Promise<void>>;
}
