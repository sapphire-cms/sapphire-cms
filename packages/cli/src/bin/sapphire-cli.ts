import {Args, createProgram} from './program';
import * as path from 'path';
import * as tmp from 'tmp';
import {DirResult} from 'tmp';
import * as yaml from 'yaml';
import {promises as fs} from 'fs';
import {getCsmConfig, getInvocationDir} from '@sapphire-cms/node';

// @ts-ignore
import spawn from 'nano-spawn';

const cliArgs = await new Promise<Args>(resolve => {
  const program = createProgram(resolve);
  program.parse();
});

const invocationDir = getInvocationDir();
const cmsConfig = await getCsmConfig(invocationDir);

const cliModuleConfig = {
  cmd: cliArgs.cmd,
  args: cliArgs.args,
  opts: Object.entries(cliArgs.opts).map(([key, value]) => `${key}=${value}`),
};

// Replace Admin Layer with CLI
cmsConfig.layers.admin = '@cli';
cmsConfig.config.modules['cli'] = cliModuleConfig;

let workDir: DirResult | null = null;

(async () => {
  try {
    workDir = tmp.dirSync({ template: 'sapphire-cms-XXXXXX' });

    // Write changed YAML config into tmp dir
    await fs.writeFile(path.resolve(workDir.name, 'sapphire-cms.config.yaml'), yaml.stringify(cmsConfig));

    // Link current node_modules
    await fs.symlink(path.resolve(invocationDir, 'node_modules'), path.resolve(workDir.name, 'node_modules'));

    await spawn('sapphire-node', {
      cwd: workDir.name,
      stdio: 'inherit',
    })
  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    if (workDir) {
      await fs.rm(workDir.name, {recursive: true, force: true});
    }
  }
})();
