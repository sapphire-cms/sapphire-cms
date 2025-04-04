import {Args, createProgram} from './program';
import * as path from 'path';
import * as tmp from 'tmp';
import * as yaml from 'yaml';
import {promises as fs} from 'fs';
import {ZCmsConfigSchema} from '@sapphire-cms/core';
import {findYamlFile} from './fs-utils';
import {loadYaml} from './yaml-utils';
// @ts-ignore
import spawn from 'nano-spawn';

const cliArgs = await new Promise<Args>(resolve => {
  const program = createProgram(resolve);
  program.parse();
});

const args = process.argv.slice(2);

const invocationDir = args.length === 1
    ? path.resolve(args[0])
    : process.cwd();

const csmConfigFile = await findYamlFile(path.resolve(invocationDir, 'sapphire-cms.config'));
if (!csmConfigFile) {
  console.error(`Missing sapphire-cms.config.yaml in ${invocationDir}`);
  process.exit(1);
}

const cmsConfig = await loadYaml(csmConfigFile!, ZCmsConfigSchema);

// Replace Admin Layer with CLI
cmsConfig.layers.admin = '@cli';
cmsConfig.config.modules['cli'] = {
  cmd: cliArgs.cmd,
  args: cliArgs.args,
  opts: Object.entries(cliArgs.opts).map(([key, value]) => `${key}=${value}`),
};

const workDir = tmp.dirSync({ template: 'sapphire-cms-XXXXXX' });

// Write changed YAML config into tmp dir
await fs.writeFile(path.resolve(workDir.name, 'sapphire-cms.config.yaml'), yaml.stringify(cmsConfig));

// Link current node_modules
await fs.symlink(path.resolve(invocationDir, 'node_modules'), path.resolve(workDir.name, 'node_modules'));

await spawn('sapphire-node', {
  cwd: workDir.name,
  stdio: 'inherit',
})

await fs.rm(workDir.name, { recursive: true, force: true });
