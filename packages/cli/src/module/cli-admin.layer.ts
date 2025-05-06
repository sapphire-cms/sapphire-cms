import { AbstractAdminLayer, PortError } from '@sapphire-cms/core';
import chalk from 'chalk';
import { ResultAsync } from 'neverthrow';
import { Cmd } from '../common';
import { CliModuleParams } from './cli.module';

export class CliAdminLayer extends AbstractAdminLayer<CliModuleParams> {
  constructor(private readonly params: { cmd: string; args: string[]; opts: string[] }) {
    super();
  }

  public async afterPortsBound(): Promise<void> {
    if (!this.params.cmd.startsWith('package:') && !this.params.cmd.startsWith('schema:')) {
      return Promise.resolve();
    }

    switch (this.params.cmd) {
      case Cmd.package_install:
        return this.installPackagesPort(this.params.args).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.package_remove:
        return this.removePackagesPort(this.params.args).match(
          () => {},
          (err) => console.error(err),
        );
      case Cmd.list_schemas:
        return this.listSchemas().match(
          () => {},
          (err) => console.error(err),
        );
      default:
        console.error(`Unknown command: "${this.params.cmd}"`);
        return Promise.resolve();
    }
  }

  private listSchemas(): ResultAsync<void, PortError> {
    return this.getContentSchemasPort().map((allSchemas) => {
      for (const schema of allSchemas) {
        console.log(
          `${chalk.blue(schema.name)} (${schema.type})   ${chalk.grey(schema.description)}`,
        );
      }
    });
  }
}
