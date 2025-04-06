import {AdminLayer} from '@sapphire-cms/core/dist/layers/admin';
import {AfterPortsBoundAware, Port} from '@sapphire-cms/core';
import {CliModuleParams} from './cli.module';
import {Cmd} from '../common';

export class CliAdminLayer implements AdminLayer<CliModuleParams>, AfterPortsBoundAware {
  public readonly installPackagesPort = new Port<string[], void>();
  public readonly removePackagesPort = new Port<string[], void>();
  public readonly haltPort = new Port<void, void>();

  public constructor(private readonly params: { cmd: string, args: string[], opts: string[] }) {
  }

  public async afterPortsBound(): Promise<void> {
    if (!this.params.cmd.startsWith('package')) {
      return Promise.resolve();
    }

    switch (this.params.cmd) {
      case Cmd.package_install:
        return this.installPackages(this.params.args);
      case Cmd.package_remove:
        return this.removePackages(this.params.args);
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
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
