import * as process from 'node:process';
import * as path from 'path';
import { Command } from '@commander-js/extra-typings';
import { fileExists, FsError } from '@sapphire-cms/node';
import { Outcome, Program, program } from 'defectless';
// @ts-expect-error cannot be resolved by Typescript but can be solved by Node
// eslint-disable-next-line import/no-unresolved
import spawn from 'nano-spawn';
import { ProcessError } from '../../common';
import { CliCommand } from './cli-command';

export const BuildCommand: CliCommand = (main: Command, invocationDir: string) => {
  main
    .command('build')
    .description('Compile the CMS and produce an optimized AOT bundle.')
    .argument(
      '[dir]',
      'Absolute or relative path to the root directory of CMS project. ' +
        'By default it is the folder of script invocation',
      '.',
    )
    .option(
      '-c, --config <file>',
      'Absolute or relative path (to the root) to the configuration file.',
      './sapphire-cms.config.yaml',
    )
    .action(async (dir, opts) => {
      const buildBinary = path.resolve(
        invocationDir,
        'node_modules',
        '@sapphire-cms',
        'aot',
        'dist',
        'sapphire-build.js',
      );

      await program(function* (): Program<void, FsError | ProcessError> {
        const aotModuleInstalled = yield fileExists(buildBinary);

        if (!aotModuleInstalled) {
          console.warn(
            'Cannot create a bundle: AOT module is missing. Install it using `scms package install aot` and try again.',
          );
          return;
        }

        return Outcome.fromSupplier(
          () =>
            spawn(buildBinary, [dir, '--config', opts.config], {
              cwd: invocationDir,
              stdio: 'inherit',
            }),
          (err) => new ProcessError('Failed to run sapphire-build process', err),
        ).map(() => {});
      }).match(
        () => {},
        (err) => {
          console.error(err);
          process.exit(1);
        },
        (defect) => {
          console.error(defect);
          process.exit(1);
        },
      );
    });
};
