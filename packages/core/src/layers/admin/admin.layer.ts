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

export interface DocsCopyMetadata {
  totalDocsCount: number;
  copiedDocsCount: number;
}

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

  startBackupTaskPort: Port<
    (credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >;
  startRestoreTaskPort: Port<
    (credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >;
  taskStatusPort: Port<
    (taskId: string, credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >;
  abortTaskPort: Port<
    (taskId: string, credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >;

  haltPort: Port<(credential?: Credential) => void, AuthorizationError>;
}
