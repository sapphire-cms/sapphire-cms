import {AbstractAdminLayer} from '@sapphire-cms/core';
import {CliModuleParams} from './cli.module';
import {Cmd} from '../common';

export class CliAdminLayer extends AbstractAdminLayer<CliModuleParams> {
  public constructor(private readonly params: { cmd: string, args: string[], opts: string[] }) {
    super();
  }

  public async afterPortsBound(): Promise<void> {
    if (!this.params.cmd.startsWith('package')) {
      return Promise.resolve();
    }

    switch (this.params.cmd) {
      case Cmd.package_install:
        return this.installPackagesPort(this.params.args);
      case Cmd.package_remove:
        return this.removePackagesPort(this.params.args);
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
  }
}
