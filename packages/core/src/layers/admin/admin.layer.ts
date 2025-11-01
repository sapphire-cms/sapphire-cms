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
import { PublicInfo } from './admin.types';

export interface AdminLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config>,
    HttpLayer,
    AfterPortsBoundAware {
  publicInfoPort: Port<() => PublicInfo>;
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
