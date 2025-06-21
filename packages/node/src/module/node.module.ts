import { getBuildParamsType, SapphireModule } from '@sapphire-cms/core';
import NodeBootstrapLayer from './node-bootstrap.layer';
import NodeDeliveryLayer from './node-delivery.layer';
import NodePersistenceLayer from './node-persistence.layer';
import NodePlatformLayer from './node-platform.layer';

const moduleParamsDef = [
  {
    name: 'root',
    type: 'string',
    required: false,
    description:
      'Absolute path to the root folder of the CMS project. ' +
      'Defaults to the directory of the script invocation.',
  },
  {
    name: 'configFile',
    type: 'string',
    required: false,
    description:
      'Absolute or relative path (from the root) to the configuration file. ' +
      'Defaults to "./sapphire-cms.config.yaml".',
  },
  {
    name: 'dataDir',
    type: 'string',
    required: false,
    description:
      'Absolute or relative path (from the root) to the folder where CMS stores its internal data. ' +
      'Defaults to "./sapphire-cms-data".',
  },
  {
    name: 'outputDir',
    type: 'string',
    required: false,
    description:
      'Absolute or relative path (from the root) to the folder where CMS outputs rendered documents. ' +
      'Defaults to "./out".',
  },
  {
    name: 'port',
    type: 'number',
    required: false,
    description: 'Port to run the server on. Defaults to 4747.',
  },
  {
    name: 'ssl',
    type: 'boolean',
    required: false,
    description: 'Enable SSL for the server. Defaults to false.',
  },
] as const;

const _params = getBuildParamsType(moduleParamsDef);
export type NodeModuleParams = typeof _params;

@SapphireModule({
  name: 'node',
  params: moduleParamsDef,
  layers: {
    bootstrap: NodeBootstrapLayer,
    persistence: NodePersistenceLayer,
    platform: NodePlatformLayer,
    delivery: NodeDeliveryLayer,
  },
})
export default class NodeModule {}
