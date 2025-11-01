import { success } from 'defectless';
import { inject, singleton } from 'tsyringe';
import * as packageJson from '../../package.json';
import { DI_TOKENS } from '../kernel';
import { AdminLayer, BootstrapLayer, SecurityLayer } from '../layers';
import { SecureAdminLayer } from './secure-admin.layer';

@singleton()
export class AdminService {
  constructor(
    @inject(SecureAdminLayer) private readonly adminLayer: AdminLayer,
    @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrapLayer: BootstrapLayer,
    @inject(DI_TOKENS.SecurityLayer) private readonly securityLayer: SecurityLayer<unknown>,
  ) {
    this.adminLayer.publicInfoPort.accept(() =>
      success({
        version: packageJson.version,
        authentication: {
          method: this.securityLayer.authenticationMethod,
        },
      }),
    );

    this.adminLayer.installPackagesPort.accept((packageNames) => {
      return this.bootstrapLayer.installPackages(packageNames);
    });

    this.adminLayer.removePackagesPort.accept((packageNames) => {
      return this.bootstrapLayer.removePackages(packageNames);
    });
  }
}
