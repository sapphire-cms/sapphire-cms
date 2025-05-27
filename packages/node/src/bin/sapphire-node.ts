import * as process from 'node:process';
import * as path from 'path';
import { Command } from '@commander-js/extra-typings';
import { CmsLoader } from '@sapphire-cms/core';
import * as packageJson from '../../package.json';
import { getInvocationDir } from '../common';
import NodeBootstrapLayer from '../module/node-bootstrap.layer';

const program = new Command()
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
    './sapphire-cms.config.yaml"',
  )
  .action(async (dir, opts) => {
    const root = path.resolve(getInvocationDir(), dir);
    const systemBootstrap = new NodeBootstrapLayer({
      root,
      configFile: opts.config,
      dataDir: '.',
      outputDir: '.',
    });
    const cmsLoader = new CmsLoader(systemBootstrap);
    await cmsLoader
      .loadSapphireCms()
      .flatMap((sapphireCms) => sapphireCms.run())
      .match(
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

program.parse();
