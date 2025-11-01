import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { AuthorizationError, Credential, DI_TOKENS, Framework, OuterError, Port } from '../kernel';
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
    this.haltPort = this.securityService.authorizingPort(delegate.haltPort, 'cms:halt');
  }

  public afterPortsBound(): Outcome<void, unknown> {
    return this.delegate.afterPortsBound();
  }
}
