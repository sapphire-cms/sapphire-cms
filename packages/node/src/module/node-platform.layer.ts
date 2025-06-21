import * as process from 'node:process';
import * as path from 'path';
import { Env, Frameworks, PlatformError, PlatformLayer, WebModule } from '@sapphire-cms/core';
import { HttpLayer } from '@sapphire-cms/core/dist/kernel/http-layer';
import { PlatformBuilder, Res } from '@tsed/common';
import { PlatformExpress } from '@tsed/platform-express';
import { Outcome, Program, program, success } from 'defectless';
import { NodeModuleParams } from './node.module';

export default class NodePlatformLayer implements PlatformLayer<NodeModuleParams> {
  public readonly supportedFrameworks = [Frameworks.TSED];
  public readonly controllers: HttpLayer[] = [];
  public readonly webModules: WebModule[] = [];
  private platform: PlatformBuilder | undefined;

  constructor(private readonly params: NodeModuleParams) {}

  public getEnv(): Outcome<Env, PlatformError> {
    return success(process.env as Env);
  }

  public addRestController(controller: HttpLayer): void {
    this.controllers.push(controller);
  }

  public addWebModule(webModule: WebModule): void {
    this.webModules.push(webModule);
  }

  public start(): Outcome<void, PlatformError> {
    return program(function* (): Program<void, PlatformError> {
      if (!this.controllers.length) {
        return success();
      }

      const controllerClasses = this.controllers.map((controller) => controller.constructor);

      const settings: Partial<TsED.Configuration> = {
        acceptMimes: ['application/json'],
        mount: {
          '/rest': controllerClasses,
        },
        statics: {},
      };

      // Set web modules
      // For @Romain Lenzotti: this way to add statics seems not work if used with Fastify platform
      for (const webModule of this.webModules) {
        settings.statics[webModule.mount] = [
          {
            root: webModule.root,
          },
        ];
      }

      const port = this.params.port || 4747;
      if (this.params.ssl) {
        settings.httpsPort = port;
        settings.httpPort = false;
      } else {
        settings.httpPort = port;
        settings.httpsPort = false;
      }

      this.platform = yield Outcome.fromFunction(
        PlatformExpress.bootstrap,
        (err) => new PlatformError('Failed to bootstrap Express platform', err),
      )(NodePlatformLayer, settings);

      // TODO: test of dynamic middleware. To remove
      // For @Romain Lenzotti: for some reason, this middleware isn't working, and requests are never logged
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.platform?.app.use((req: any, res: any, next: any) => {
        console.log(`[REQ] ${req.method} ${req.url}`);
        next();
      });

      // After bootstrap, add fallback middleware for SPA
      for (const webModule of this.webModules) {
        if (webModule.spa) {
          console.log(`Register redirection for SPA ${webModule.name}.`);

          // For @Romain Lenzotti: for some reason this handler for SPA is never fired
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          this.platform?.app.get(`${webModule.mount}/*`, (_: any, res: Res) => {
            res.sendFile(path.resolve(webModule.root, 'index.html'));
          });
        }
      }

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
      (err) => new PlatformError('Failed to stop Express server', err),
    );
  }
}
