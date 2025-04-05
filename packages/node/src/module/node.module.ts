import NodeBootstrapLayer from './node-bootstrap.layer';
import NodePersistenceLayer from './node-persistence.layer';
import {getBuildParamsType, SapphireModule} from '@sapphire-cms/core';

const moduleParamsDef = [
  {
    name: 'root',
    description: 'Absolute or relative path to the root folder of the project containing sapphire-cms.config.yaml. ' +
      'By default is ".".',
    type: 'string',
    required: false,
  },
  {
    name: 'dataRoot',
    description: 'Absolute or relative path to the folder where CMS will store its data.',
    type: 'string',
    required: true,
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
  }
})
export default class NodeModule {
}
