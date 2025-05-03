import { AbstractAdminLayer } from '@sapphire-cms/core';
import chalk from 'chalk';
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
        return this.installPackagesPort(this.params.args);
      case Cmd.package_remove:
        return this.removePackagesPort(this.params.args);
      case Cmd.list_schemas:
        return await this.listSchemas();
      default:
        throw new Error(`Unknown command: "${this.params.cmd}"`);
    }
  }

  private async listSchemas() {
    const allSchemas = await this.getContentSchemasPort();

    for (const schema of allSchemas) {
      console.log(
        `${chalk.blue(schema.name)} (${schema.type})   ${chalk.grey(schema.description)}`,
      );
    }
  }
}
