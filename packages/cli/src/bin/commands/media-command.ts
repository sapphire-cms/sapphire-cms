import * as path from 'path';
import { Command } from '@commander-js/extra-typings';
import { CliOptions, Cmd } from '../../common';
import { Args, cmsExecutor } from '../executors';
import { CliCommand } from './cli-command';

export const MediaCommand: CliCommand = (program: Command, invocationDir: string) => {
  const mediaCmd = program.command('media').description('Manage media used by CMS.');

  mediaCmd
    .command('create')
    .alias('c')
    .description('Create a new media')
    .argument('<file>', 'Path to the media file to upload')
    .option('-p, --path <path>', 'Slash-separated path where the media document will be created')
    .option('-t, --title <string>', 'Human-readable title for the media')
    .option('-a, --alt <string>', 'Alternative text used for accessibility and screen readers')
    .option('-c, --caption <string>', 'Visible caption displayed alongside the media')
    .action(async (file: string, opts: CliOptions, command: Command<[string]>) => {
      file = path.resolve(invocationDir, file);

      const cliArgs: Args = {
        cmd: Cmd.media_create,
        args: [file],
        opts,
        credential: (command.optsWithGlobals() as CliOptions).credential,
      };

      await cmsExecutor(invocationDir, cliArgs);
    });
};
