import * as process from 'node:process';
import { Env, PlatformError, PlatformLayer, success, Outcome } from '@sapphire-cms/core';
import { NodeModuleParams } from './node.module';

export default class NodePlatformLayer implements PlatformLayer<NodeModuleParams> {
  public getEnv(): Outcome<Env, PlatformError> {
    return success(process.env as Env);
  }
}
