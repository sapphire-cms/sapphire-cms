import {AdminLayer} from './admin.layer';
import {DeferredTask} from '../../common';

export class DefaultAdminLayer implements AdminLayer<void> {
  public readonly onHalt: Promise<void>;
  public readonly installPackagesTask = new DeferredTask<string[], void>();

  private haltResolve!: () => void;

  public constructor() {
    this.onHalt = new Promise<void>((resolve) => {
      this.haltResolve = resolve;
    });
  }

  public installPackages(packageNames: string[]): Promise<void> {
    return this.installPackagesTask.submit(packageNames);
  }

  public removePackages(packageNames: string[]): Promise<void> {
    // TODO: code this method;
    return Promise.resolve();
  }

  public halt(): Promise<void> {
    console.log('Sapphire CMS is halting...');
    this.haltResolve();
    return Promise.resolve();
  }
}
