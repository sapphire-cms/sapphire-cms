import * as process from 'node:process';
import { Env, PlatformError, PlatformLayer } from '@sapphire-cms/core';
import { okAsync, ResultAsync } from 'neverthrow';
import { NodeModuleParams } from './node.module';

export default class NodePlatformLayer implements PlatformLayer<NodeModuleParams> {
  public getEnv(): ResultAsync<Env, PlatformError> {
    return okAsync(process.env as Env);
  }
}
