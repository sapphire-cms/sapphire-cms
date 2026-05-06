import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import {
  AuthorizationError,
  Credential,
  DI_TOKENS,
  Framework,
  OuterError,
  Port,
  TaskState,
} from '../kernel';
import { AdminLayer, PublicInfo } from '../layers';
import { SecurityService } from './security.service';

@singleton()
export class SecureAdminLayer implements AdminLayer {
  public readonly framework: Framework;

  public readonly publicInfoPort: Port<() => PublicInfo>;

  public readonly installPackagesPort: Port<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >;
  public readonly removePackagesPort: Port<
    (packageNames: string[], credential?: Credential) => void,
    OuterError | AuthorizationError
  >;

  public readonly startBackupPort: Port<
    (credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  public readonly backupStatusPort: Port<
    (taskId: string, credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  public readonly abortBackupPort: Port<
    (credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  public readonly startRestorePort: Port<
    (credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  public readonly restoreStatusPort: Port<
    (taskId: string, credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;
  public readonly abortRestorePort: Port<
    (credential?: Credential) => TaskState,
    OuterError | AuthorizationError
  >;

  public readonly haltPort: Port<(credential?: Credential) => void, AuthorizationError>;

  constructor(
    @inject(DI_TOKENS.AdminLayer) private readonly delegate: AdminLayer,
    @inject(SecurityService) private readonly securityService: SecurityService,
  ) {
    this.framework = delegate.framework;

    // Unsecured public into port
    this.publicInfoPort = delegate.publicInfoPort;

    this.installPackagesPort = this.securityService.authorizingPort(
      delegate.installPackagesPort,
      'cms:install_packages',
    );
    this.removePackagesPort = this.securityService.authorizingPort(
      delegate.removePackagesPort,
      'cms:remove_packages',
    );

    this.startBackupPort = this.securityService.authorizingPort(
      delegate.startBackupPort,
      'cms:backup',
    );
    this.backupStatusPort = this.securityService.authorizingPort(
      delegate.backupStatusPort,
      'cms:backup',
    );
    this.abortBackupPort = this.securityService.authorizingPort(
      delegate.abortBackupPort,
      'cms:backup',
    );
    this.startRestorePort = this.securityService.authorizingPort(
      delegate.startRestorePort,
      'cms:backup',
    );
    this.restoreStatusPort = this.securityService.authorizingPort(
      delegate.restoreStatusPort,
      'cms:backup',
    );
    this.abortRestorePort = this.securityService.authorizingPort(
      delegate.abortRestorePort,
      'cms:backup',
    );

    this.haltPort = this.securityService.authorizingPort(delegate.haltPort, 'cms:halt');
  }

  public afterPortsBound(): Outcome<void, unknown> {
    return this.delegate.afterPortsBound();
  }
}
