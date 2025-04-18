import {inject, singleton} from 'tsyringe';
import {DI_TOKENS} from '../kernel';
import {AdminLayer, BootstrapLayer} from '../layers';

@singleton()
export class AdminService {
  public constructor(@inject(DI_TOKENS.AdminLayer) private readonly adminLayer: AdminLayer<any>,
                     @inject(DI_TOKENS.BootstrapLayer) private readonly bootstrapLayer: BootstrapLayer<any>) {
    this.adminLayer.installPackagesPort.accept(async packageNames => {
      await this.bootstrapLayer.installPackages(packageNames);
    });

    // this.adminLayer.removePackagesPort.accept(async packageNames => {
    //   await this.bootstrapLayer.d(packageNames);
    // });

    this.adminLayer.getContentSchemasPort.accept(() => {
      return this.bootstrapLayer.getContentSchemas();
    });
  }
}
