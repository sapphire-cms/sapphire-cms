import {Port} from '../../common';
import {AfterPortsBoundAware, Layer} from '../../kernel';

export interface AdminLayer<Config> extends Layer<Config>, AfterPortsBoundAware {
  installPackagesPort: Port<string[], void>;
  removePackagesPort: Port<string[], void>;
  haltPort: Port<void, void>;

  installPackages(packageNames: string[]): Promise<void>;
  removePackages(packageNames: string[]): Promise<void>;
  halt(): Promise<void>;
}
