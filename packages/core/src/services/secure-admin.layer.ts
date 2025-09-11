import { Outcome } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { AuthorizationError, Credential, DI_TOKENS, OuterError, Port } from '../kernel';
import { AdminLayer } from '../layers';
import { SecurityService } from './security.service';

@singleton()
export class SecureAdminLayer implements AdminLayer {
  public readonly framework: string;
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
