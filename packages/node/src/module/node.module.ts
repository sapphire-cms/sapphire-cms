import NodeBootstrapLayer from './node-bootstrap.layer';
import NodePersistenceLayer from './node-persistence.layer';
import {getBuildParamsType, SapphireModule} from '@sapphire-cms/core';
import NodePlatformLayer from './node-platform.layer';

const moduleParamsDef = [
  {
    name: 'root',
    type: 'string',
    required: false,
    description: 'Absolute path to the root folder of CMS project. ' +
        'By default is directory of script invocation.',
  },
  {
    name: 'configFile',
    type: 'string',
    required: false,
    description: 'Absolute or relative path (to the root) to the configuration file. ' +
        'By default is "./sapphire-cms.config.yaml".',
  },
  {
    name: 'dataDir',
    type: 'string',
    required: false,
    description: 'Absolute or relative (to the root) path to the folder where CMS will store its data. ' +
        'By default is "./sapphire-cms-data".',
  }
] as const;

const params = getBuildParamsType(moduleParamsDef);
export type NodeModuleParams = typeof params;

@SapphireModule({
  name: 'node',
  params: moduleParamsDef,
  layers: {
    bootstrap: NodeBootstrapLayer,
    persistence: NodePersistenceLayer,
    platform: NodePlatformLayer,
  }
})
export default class NodeModule {
}
