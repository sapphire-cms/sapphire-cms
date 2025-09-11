import { AnyParams } from '../../common';
import {
  AfterPortsBoundAware,
  AuthorizationError,
  HttpLayer,
  Layer,
  OuterError,
  Port,
  Credential,
} from '../../kernel';

export interface AdminLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config>,
    HttpLayer,
    AfterPortsBoundAware {
  installPackagesPort: Port<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >;
  removePackagesPort: Port<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >;
  haltPort: Port<(credential?: Credential) => void, AuthorizationError>;
}
