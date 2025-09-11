import * as process from 'node:process';
import { Command } from '@commander-js/extra-typings';
import * as packageJson from '../../package.json';
import {
  BuildCommand,
  CreateCommand,
  DeployCommand,
  DocumentCommand,
  InitCommand,
  PackageCommand,
  PipelineCommand,
  SchemaCommand,
  ShaperCommand,
  StartCommand,
} from './commands';

const program = new Command()
  .name('sapphire-cms')
  .alias('scms')
  .description('Sapphire CMS command-line manager and content editor.')
  .version(packageJson.version)
  .option('-c, --credential <string>', 'Credential');

const invocationDir = process.cwd();

PackageCommand(program, invocationDir);
SchemaCommand(program, invocationDir);
PipelineCommand(program, invocationDir);
ShaperCommand(program, invocationDir);
DocumentCommand(program, invocationDir);
StartCommand(program, invocationDir);
CreateCommand(program, invocationDir);
InitCommand(program, invocationDir);
BuildCommand(program, invocationDir);
DeployCommand(program, invocationDir);

program.parse();
