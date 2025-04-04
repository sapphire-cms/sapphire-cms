import {DeferredTask} from '../../common';
import {Layer} from '../../kernel';

export interface AdminLayer<Config> extends Layer<Config> {
  onHalt: Promise<void>;
  installPackagesTask: DeferredTask<string[], void>;

  installPackages(packageNames: string[]): Promise<void>;
  removePackages(packageNames: string[]): Promise<void>;
  halt(): Promise<void>;
}
