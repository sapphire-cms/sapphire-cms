import { inject, singleton } from 'tsyringe';
import { DI_TOKENS } from '../kernel';
import { AdminLayer, BootstrapLayer } from '../layers';
import { SecureAdminLayer } from './secure-admin.layer';

@singleton()
export class AdminService {
  constructor(
    @inject(SecureAdminLayer) private readonly adminLayer: AdminLayer,
    @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrapLayer: BootstrapLayer,
  ) {
    this.adminLayer.installPackagesPort.accept((packageNames) => {
      return this.bootstrapLayer.installPackages(packageNames);
    });

    this.adminLayer.removePackagesPort.accept((packageNames) => {
      return this.bootstrapLayer.removePackages(packageNames);
    });
  }
}
