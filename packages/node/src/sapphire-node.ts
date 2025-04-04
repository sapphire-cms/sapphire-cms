import * as path from 'path';
import {findYamlFile} from './fs-utils';
import {loadYaml} from './yaml-utils';
import {AppFactory, ZCmsConfigSchema} from '@sapphire-cms/core';
import {NodeModuleParams} from './node.module';
import NodeBootstrapLayer from './node-bootstrap.layer';

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

const loaderParams: NodeModuleParams = cmsConfig.config.modules['node']
    ? cmsConfig.config.modules['node'] as NodeModuleParams
    : {
      root: '.',
      dataRoot: '.',
    };
loaderParams['root'] = loaderParams['root']
    ? path.resolve(invocationDir, loaderParams['root'])
    : invocationDir;

const loader = new NodeBootstrapLayer(loaderParams);
const allModules = await loader.loadModules();

const appFactory = new AppFactory(cmsConfig, loader, allModules);
const sapphireCms = await appFactory.createSapphireCms();

await sapphireCms.run();
