import {CmsLoader} from '@sapphire-cms/core';
import {getInvocationDir} from '../utils';
import {NodeModuleParams} from '../module/node.module';
import NodeBootstrapLayer from '../module/node-bootstrap.layer';

const invocationDir = getInvocationDir();
const systemBootstrapParams: NodeModuleParams = {
  root: invocationDir,
  dataRoot: invocationDir,
};
const systemBootstrap = new NodeBootstrapLayer(systemBootstrapParams);
const cmsLoader = new CmsLoader(systemBootstrap);
const sapphireCms = await cmsLoader.loadSapphireCms();

await sapphireCms.run();
