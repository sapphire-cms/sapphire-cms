import * as process from 'node:process';
import * as path from 'path';
import { Command } from '@commander-js/extra-typings';
import { BootstrapError, CmsLoader, Option, PlatformError } from '@sapphire-cms/core';
import { failure, Program, program } from 'defectless';
import * as packageJson from '../../package.json';
import { FsError, resolveYamlFile } from '../common';
import NodeBootstrapLayer from '../module/node-bootstrap.layer';

const main = new Command()
  .name('sapphire-node')
  .description('Sapphire CMS runner for Node.')
  .version(packageJson.version)
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
    const root = path.resolve(process.cwd(), dir);
    const configFilename = path.resolve(root, opts.config);

    await program(function* (): Program<void, FsError | BootstrapError | PlatformError> {
      const configFilenameOption: Option<string> = yield resolveYamlFile(configFilename);

      if (Option.isNone(configFilenameOption)) {
        return failure(new FsError(`Missing CMS config file ${configFilename}`));
      }

      const systemBootstrap = new NodeBootstrapLayer({
        root,
        configFile: configFilenameOption.value,
        dataDir: '.',
        outputDir: '.',
        port: 0,
        ssl: false,
      });
      const cmsLoader = new CmsLoader(systemBootstrap);
      const sapphireCms = yield cmsLoader.loadSapphireCms();

      return sapphireCms.run();
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

main.parse();
