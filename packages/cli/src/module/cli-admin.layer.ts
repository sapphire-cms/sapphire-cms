import { AbstractAdminLayer, Frameworks } from '@sapphire-cms/core';
import { Outcome, success } from 'defectless';
import { Cmd } from '../common';
import { CliModuleParams } from './cli.module';

export class CliAdminLayer extends AbstractAdminLayer<CliModuleParams> {
  public readonly framework = Frameworks.NONE;

  constructor(private readonly params: { cmd: string; args: string[]; opts: string[] }) {
    super();
  }

  public afterPortsBound(): Outcome<void, never> {
    if (!this.params.cmd.startsWith('package:')) {
      return success();
    }

    switch (this.params.cmd) {
      case Cmd.package_install:
        return Outcome.fromSupplier(() =>
          this.installPackagesPort(this.params.args).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      case Cmd.package_remove:
        return Outcome.fromSupplier(() =>
          this.removePackagesPort(this.params.args).match(
            () => {},
            (err) => console.error(err),
            (defect) => console.error(defect),
          ),
        );
      default:
        console.error(`Unknown command: "${this.params.cmd}"`);
        return success();
    }
  }
}
