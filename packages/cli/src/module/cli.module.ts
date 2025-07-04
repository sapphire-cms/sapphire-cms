import { getBuildParamsType, SapphireModule } from '@sapphire-cms/core';
import { CliAdminLayer } from './cli-admin.layer';
import { CliManagementLayer } from './cli-management.layer';

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
    description:
      'Text editor to use for editing documents. ' +
      "If not specified, the system's default editor will be used.",
  },
] as const;

const _params = getBuildParamsType(moduleParamsDef);
export type CliModuleParams = typeof _params;

@SapphireModule({
  name: 'cli',
  params: moduleParamsDef,
  layers: {
    admin: CliAdminLayer,
    management: CliManagementLayer,
  },
})
export default class CliModule {}
