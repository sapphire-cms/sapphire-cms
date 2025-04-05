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

  public afterPortsBound(): Promise<void> {
    const opts = new Map<string, string>();
    for (const opt of this.params.opts) {
      const [ key, value ] = opt.split('=');
      opts.set(key, value);
    }

    switch (this.params.cmd) {
      case Cmd.package:
        if (opts.has('install')) {
          return this.installPackagesPort.submit(this.params.args);
        }
        break;
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }

    return Promise.resolve();
  }

  public installPackages(packageNames: string[]): Promise<void> {
    return this.installPackagesPort.submit(packageNames);
  }

  public removePackages(packageNames: string[]): Promise<void> {
    // TODO: code this method;
    return Promise.resolve();
  }

  public halt(): Promise<void> {
    console.log('Sapphire CMS is halting...');
    return this.haltPort.submit();
  }
}
