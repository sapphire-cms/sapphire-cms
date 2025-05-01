import {promises as fs} from 'fs';
import * as path from 'path';
import {getCsmConfigFromDir, getInvocationDir} from '@sapphire-cms/node';
import spawn from 'nano-spawn/source';
import {temporaryFile} from 'tempy';
import * as yaml from 'yaml';
import {optsToArray} from '../common';
import {Args, createProgram} from './program';

const cliArgs = await new Promise<Args>(resolve => {
  const program = createProgram(resolve);
  program.parse();
});

const invocationDir = getInvocationDir();
const cmsConfig = await getCsmConfigFromDir(invocationDir);

const cliModuleConfig = {
  cmd: cliArgs.cmd,
  args: cliArgs.args,
  opts: cliArgs.opts ? optsToArray(cliArgs.opts) : [],
};

// Replace Admin and Management layers with CLI
cmsConfig.layers.admin = '@cli';
cmsConfig.layers.management = '@cli';
cmsConfig.config.modules.cli ||= {};
Object.assign(cmsConfig.config.modules.cli, cliModuleConfig);

const tmpConfigFile = temporaryFile({ name: 'sapphire-cms.config.yaml' });
cmsConfig.config.modules.node ||= {};
cmsConfig.config.modules.node.configFile = tmpConfigFile;

(async () => {
  try {
    // Write tmp config file
    await fs.writeFile(tmpConfigFile, yaml.stringify(cmsConfig));

    const sapphireNodePath = path.join(
        invocationDir,
        'node_modules',
        '@sapphire-cms',
        'node',
        'dist',
        'sapphire-node.js',
    );
    await spawn(sapphireNodePath, [ '--config', tmpConfigFile ], {
      cwd: invocationDir,
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    // Delete tmp dir
    await fs.rm(path.dirname(tmpConfigFile), { recursive: true, force: true });
  }
})();
