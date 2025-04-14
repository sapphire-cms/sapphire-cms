import {getBuildParamsType, SapphireModule} from '@sapphire-cms/core';
import {CliAdminLayer} from './cli-admin.layer';
import {CliManagementLayer} from './cli-management.layer';

const moduleParamsDef = [
  {
    name: 'cmd',
    type: 'string',
    required: true,
  },
  {
    name: 'args',
    type: 'string',
    isList: true,
    required: true,
  },
  {
    name: 'opts',
    type: 'string',
    isList: true,
    required: true,
  },
  {
    name: 'editor',
    type: 'string',
    description: 'Used text editor. If not specified, default system editor will be chosen.'
  }
] as const;

const params = getBuildParamsType(moduleParamsDef);
export type CliModuleParams = typeof params;

@SapphireModule({
  name: 'cli',
  params: moduleParamsDef,
  layers: {
    admin: CliAdminLayer,
    management: CliManagementLayer,
  }
})
export default class CliModule {
}
