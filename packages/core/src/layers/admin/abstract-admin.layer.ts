import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import {
  AuthorizationError,
  createPort,
  Credential,
  Framework,
  OuterError,
  TaskState,
} from '../../kernel';
import { AdminLayer, DocsCopyMetadata } from './admin.layer';
import { PublicInfo } from './admin.types';

export abstract class AbstractAdminLayer<Config extends AnyParams | undefined = undefined>
  implements AdminLayer<Config>
{
  public abstract readonly framework: Framework;

  public readonly publicInfoPort = createPort<() => PublicInfo>();

  public readonly installPackagesPort = createPort<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >();
  public readonly removePackagesPort = createPort<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >();

  public readonly startBackupTaskPort = createPort<
    (credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >();
  public readonly startRestoreTaskPort = createPort<
    (credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >();
  public readonly taskStatusPort = createPort<
    (taskId: string, credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >();
  public readonly abortTaskPort = createPort<
    (taskId: string, credential?: Credential) => TaskState<DocsCopyMetadata>,
    OuterError | AuthorizationError
  >();

  public readonly haltPort = createPort<(credential?: Credential) => void, AuthorizationError>();

  public abstract afterPortsBound(): Outcome<void, never>;
}
