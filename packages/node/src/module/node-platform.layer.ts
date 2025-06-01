import * as process from 'node:process';
import { Env, Frameworks, PlatformError, PlatformLayer } from '@sapphire-cms/core';
import { HttpLayer } from '@sapphire-cms/core/dist/kernel/http-layer';
import { PlatformBuilder } from '@tsed/common';
import { PlatformFastify } from '@tsed/platform-fastify';
import { Outcome, Program, program, success } from 'defectless';
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

  public start(): Outcome<void, PlatformError> {
    return program(function* (): Program<void, PlatformError> {
      if (!this.controllers.length) {
        return success();
      }

      const controllerClasses = this.controllers.map((controller) => controller.constructor);

      const settings: Partial<TsED.Configuration> = {
        acceptMimes: ['application/json'],
        httpPort: process.env.PORT || 8083,
        httpsPort: false,
        mount: {
          '/rest': controllerClasses,
        },
        plugins: ['@fastify/accepts', '@fastify/cors'],
      };

      this.platform = yield Outcome.fromFunction(
        PlatformFastify.bootstrap,
        (err) => new PlatformError('Failed to bootstrap Fastify platform', err),
      )(NodePlatformLayer, settings);

      return Outcome.fromSupplier(
        () => this.platform!.listen(),
        (err) => new PlatformError('Failed to listen', err),
      );
    }, this);
  }

  public halt(): Outcome<void, PlatformError> {
    if (!this.platform) {
      return success();
    }

    console.log('Halting server...');

    return Outcome.fromSupplier(
      () => this.platform!.stop(),
      (err) => new PlatformError('Failed to stop Fastify server', err),
    );
  }
}
