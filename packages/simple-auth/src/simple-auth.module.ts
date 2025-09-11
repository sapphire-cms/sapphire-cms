import { getBuildParamsType, SapphireModule } from '@sapphire-cms/core';
import { SimpleAuthSecurityLayer } from './simple-auth-security.layer';

const moduleParamsDef = [
  {
    name: 'username',
    type: 'string',
    required: true,
    description: 'Administrator username',
  },
  {
    name: 'password',
    type: 'string',
    required: true,
    description: 'Administrator password',
  },
] as const;

const _params = getBuildParamsType(moduleParamsDef);
export type SimpleAuthModuleParams = typeof _params;

@SapphireModule({
  name: 'simple-auth',
  params: moduleParamsDef,
  layers: {
    security: SimpleAuthSecurityLayer,
  },
})
export default class SimpleAuthModule {}
