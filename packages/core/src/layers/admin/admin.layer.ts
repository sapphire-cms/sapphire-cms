import {AfterPortsBoundAware, Layer, Port} from '../../kernel';

export interface AdminLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  installPackagesPort: Port<(packageNames: string[]) => Promise<void>>;
  removePackagesPort: Port<(packageNames: string[]) => Promise<void>>;
  haltPort: Port<() => Promise<void>>;
}
