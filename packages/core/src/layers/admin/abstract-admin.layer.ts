import {AnyParams} from '../../common';
import {createPort} from '../../kernel';
import {ContentSchema} from '../../model';
import {AdminLayer} from './admin.layer';

export abstract class AbstractAdminLayer<Config extends AnyParams | undefined = undefined> implements AdminLayer<Config> {
  public readonly installPackagesPort = createPort<(packageNames: string[]) => Promise<void>>();
  public readonly removePackagesPort = createPort<(packageNames: string[]) => Promise<void>>();

  public readonly getContentSchemasPort = createPort<() => Promise<ContentSchema[]>>();

  public readonly haltPort = createPort<() => Promise<void>>();

  public abstract afterPortsBound(): Promise<void>;
}
