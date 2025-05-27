import { AbstractAdminLayer, Frameworks, PortError } from '@sapphire-cms/core';
import chalk from 'chalk';
import { Outcome, success } from 'defectless';
import { Cmd } from '../common';
import { CliModuleParams } from './cli.module';

export class CliAdminLayer extends AbstractAdminLayer<CliModuleParams> {
  public readonly framework = Frameworks.NONE;

  constructor(private readonly params: { cmd: string; args: string[]; opts: string[] }) {
    super();
  }

  public afterPortsBound(): Outcome<void, never> {
    if (!this.params.cmd.startsWith('package:') && !this.params.cmd.startsWith('schema:')) {
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
      case Cmd.list_schemas:
        return Outcome.fromSupplier(() =>
          this.listSchemas().match(
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

  private listSchemas(): Outcome<void, PortError> {
    return this.getContentSchemasPort().map((allSchemas) => {
      for (const schema of allSchemas) {
        console.log(
          `${chalk.blue(schema.name)} (${schema.type})   ${chalk.grey(schema.description)}`,
        );
      }
    });
  }
}
