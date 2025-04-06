import {AdminLayer} from './admin.layer';
import {Port} from '../../common';

export class DefaultAdminLayer implements AdminLayer<void> {
  public readonly installPackagesPort = new Port<string[], void>();
  public readonly removePackagesPort = new Port<string[], void>();
  public readonly haltPort = new Port<void, void>();

  public afterPortsBound(): Promise<void> {
    // DO NOTHING
    return Promise.resolve();
  }

  public installPackages(packageNames: string[]): Promise<void> {
    return this.installPackagesPort.submit(packageNames);
  }

  public removePackages(packageNames: string[]): Promise<void> {
    return this.removePackagesPort.submit(packageNames);
  }

  public halt(): Promise<void> {
    console.log('Sapphire CMS is halting...');
    return this.haltPort.submit();
  }
}
