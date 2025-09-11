import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { AuthorizationError, createPort, OuterError, Credential } from '../../kernel';
import { AdminLayer } from './admin.layer';

export abstract class AbstractAdminLayer<Config extends AnyParams | undefined = undefined>
  implements AdminLayer<Config>
{
  public abstract readonly framework: string;

  public readonly installPackagesPort = createPort<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >();
  public readonly removePackagesPort = createPort<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >();
  public readonly haltPort = createPort<(credential?: Credential) => void, AuthorizationError>();

  public abstract afterPortsBound(): Outcome<void, never>;
}
