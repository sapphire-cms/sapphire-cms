import { success } from 'defectless';
import { inject, singleton } from 'tsyringe';
import { DI_TOKENS } from '../kernel';
import { AdminLayer, BootstrapLayer } from '../layers';
import { CmsContext } from './cms-context';

@singleton()
export class AdminService {
  constructor(
    @inject(CmsContext) cmsContext: CmsContext,
    @inject(DI_TOKENS.AdminLayer) private readonly adminLayer: AdminLayer,
    @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrapLayer: BootstrapLayer,
  ) {
    this.adminLayer.installPackagesPort.accept((packageNames) => {
      return this.bootstrapLayer.installPackages(packageNames);
    });

    // this.adminLayer.removePackagesPort.accept(async packageNames => {
    //   await this.bootstrapLayer.d(packageNames);
    // });

    this.adminLayer.getContentSchemasPort.accept(() => {
      return success([...cmsContext.publicContentSchemas.values()]);
    });
  }
}
