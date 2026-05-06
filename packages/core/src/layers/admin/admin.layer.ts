import { AnyParams } from '../../common';
import {
  AfterPortsBoundAware,
  AuthorizationError,
  HttpLayer,
  Layer,
  OuterError,
  Port,
  Credential,
  TaskState,
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

  startBackupPort: Port<(credential?: Credential) => TaskState, OuterError | AuthorizationError>;
  backupStatusPort: Port<
    (taskId: string, credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  abortBackupPort: Port<(credential?: Credential) => TaskState, OuterError | AuthorizationError>;
  startRestorePort: Port<(credential?: Credential) => TaskState, OuterError | AuthorizationError>;
  restoreStatusPort: Port<
    (taskId: string, credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  abortRestorePort: Port<(credential?: Credential) => TaskState, OuterError | AuthorizationError>;

  haltPort: Port<(credential?: Credential) => void, AuthorizationError>;
}
