import { AnyParams } from '../../common';
import { createPort, OuterError } from '../../kernel';
import { ContentSchema } from '../../model';
import { AdminLayer } from './admin.layer';

export abstract class AbstractAdminLayer<Config extends AnyParams | undefined = undefined>
  implements AdminLayer<Config>
{
  public readonly installPackagesPort = createPort<(packageNames: string[]) => void, OuterError>();
  public readonly removePackagesPort = createPort<(packageNames: string[]) => void, OuterError>();

  public readonly getContentSchemasPort = createPort<() => ContentSchema[]>();

  public readonly haltPort = createPort<() => void>();

  public abstract afterPortsBound(): Promise<void>;
}
