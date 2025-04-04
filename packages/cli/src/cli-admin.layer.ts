import {AdminLayer} from '@sapphire-cms/core/dist/layers/admin';
import {DeferredTask} from '@sapphire-cms/core';
import {CliModuleParams} from './cli.module';

export enum Cmd {
  package = 'package',
}

export class CliAdminLayer implements AdminLayer<CliModuleParams> {
  public readonly onHalt: Promise<void>;
  public readonly installPackagesTask = new DeferredTask<string[], void>();

  private haltResolve!: () => void;

  public constructor(private readonly params: { cmd: string, args: string[], opts: string[] }) {
    this.onHalt = new Promise<void>((resolve) => {
      this.haltResolve = resolve;
    });
  }

  public afterInit(): Promise<void> {
    const opts = new Map<string, string>();
    for (const opt of this.params.opts) {
      const [ key, value ] = opt.split('=');
      opts.set(key, value);
    }

    switch (this.params.cmd) {
      case Cmd.package:
        if (opts.has('install')) {
          this.installPackagesTask.submit(this.params.args);
        }
        break;
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }

    return Promise.resolve();
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
