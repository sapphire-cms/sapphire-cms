import {AdminLayer} from './admin.layer';
import {createPort} from '../../kernel';

export abstract class AbstractAdminLayer<Config> implements AdminLayer<Config> {
  public readonly installPackagesPort = createPort<(packageNames: string[]) => Promise<void>>();
  public readonly removePackagesPort = createPort<(packageNames: string[]) => Promise<void>>();
  public readonly haltPort = createPort<() => Promise<void>>();

  public abstract afterPortsBound(): Promise<void>;
}
