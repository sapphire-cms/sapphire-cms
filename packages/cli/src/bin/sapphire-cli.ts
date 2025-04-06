import {Args, createProgram} from './program';
import * as path from 'path';
import {temporaryFile} from 'tempy';
import * as yaml from 'yaml';
import {promises as fs} from 'fs';
import {optsToArray} from '../common';
import {getCsmConfigFromDir, getInvocationDir} from '@sapphire-cms/node';

// @ts-ignore
import spawn from 'nano-spawn';

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

    await spawn('sapphire-node', [ '--config', tmpConfigFile ], {
      cwd: invocationDir,
      stdio: 'inherit',
    })
  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    // Delete tmp dir
    await fs.rm(path.dirname(tmpConfigFile), { recursive: true, force: true });
  }
})();
