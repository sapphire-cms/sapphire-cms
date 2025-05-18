import * as process from 'node:process';
import { Env, PlatformError, PlatformLayer } from '@sapphire-cms/core';
import { Outcome, success } from 'defectless';
import { NodeModuleParams } from './node.module';

export default class NodePlatformLayer implements PlatformLayer<NodeModuleParams> {
  public getEnv(): Outcome<Env, PlatformError> {
    return success(process.env as Env);
  }
}
