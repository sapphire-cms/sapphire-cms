import * as process from 'node:process';
import { Env, Frameworks, PlatformError, PlatformLayer } from '@sapphire-cms/core';
import { HttpLayer } from '@sapphire-cms/core/dist/kernel/http-layer';
import { PlatformBuilder } from '@tsed/common';
import { PlatformFastify } from '@tsed/platform-fastify';
import { Outcome, success } from 'defectless';
import { NodeModuleParams } from './node.module';

export default class NodePlatformLayer implements PlatformLayer<NodeModuleParams> {
  public readonly supportedFrameworks = [Frameworks.TSED];
  public readonly controllers: HttpLayer[] = [];
  private platform: PlatformBuilder | undefined;

  public getEnv(): Outcome<Env, PlatformError> {
    return success(process.env as Env);
  }

  public addRestController(controller: HttpLayer): void {
    this.controllers.push(controller);
  }

  public async start(): Promise<void> {
    if (!this.controllers.length) {
      return Promise.resolve();
    }

    const controllerClasses = this.controllers.map((controller) => controller.constructor);

    const settings: Partial<TsED.Configuration> = {
      acceptMimes: ['application/json'],
      httpPort: process.env.PORT || 8083,
      httpsPort: false,
      mount: {
        '/rest': controllerClasses,
      },
      plugins: ['@fastify/accepts'],
    };

    this.platform = await PlatformFastify.bootstrap(NodePlatformLayer, settings);
    return this.platform.listen();
  }

  public halt(): Promise<void> {
    if (!this.platform) {
      return Promise.resolve();
    }

    console.log('Halting server...');
    return this.platform!.stop();
  }
}
