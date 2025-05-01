import * as process from 'node:process';
import {Env, PlatformLayer} from '@sapphire-cms/core';
import {NodeModuleParams} from './node.module';

export default class NodePlatformLayer implements PlatformLayer<NodeModuleParams> {
  public getEnv(): Promise<Env> {
    return Promise.resolve(process.env as Env);
  }
}
