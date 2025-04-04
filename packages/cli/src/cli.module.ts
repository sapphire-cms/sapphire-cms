import {getBuildParamsType, SapphireModule} from '@sapphire-cms/core';
import {CliAdminLayer} from './cli-admin.layer';

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
  }
] as const;

const params = getBuildParamsType(moduleParamsDef);
export type CliModuleParams = typeof params;

@SapphireModule({
  name: 'cli',
  params: moduleParamsDef,
  layers: {
    admin: CliAdminLayer,
  }
})
export default class CliModule {
}
