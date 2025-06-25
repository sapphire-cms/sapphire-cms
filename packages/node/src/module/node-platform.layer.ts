import * as process from 'node:process';
import * as path from 'path';
import { Env, Frameworks, PlatformError, PlatformLayer, WebModule } from '@sapphire-cms/core';
import { HttpLayer } from '@sapphire-cms/core/dist/kernel/http-layer';
import { PlatformApplication, PlatformBuilder, Res } from '@tsed/common';
import { inject } from '@tsed/di';
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
        express: {
          bodyParser: {
            json: {},
          },
        },
        mount: {
          '/rest': controllerClasses,
        },
        middlewares: ['cors', 'json-parser'],
        statics: {},
        imports: [
          {
            token: NodePlatformLayer,
            use: this,
          },
        ],
      };

      // Set web modules
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
      (err) => new PlatformError('Failed to halt Express server', err),
    );
  }

  /**
   * Add fallback middleware for SPA.
   */
  protected $afterRoutesInit(): void {
    const app = inject(PlatformApplication);

    for (const webModule of this.webModules) {
      if (webModule.spa) {
        console.log(`Register redirection for SPA ${webModule.name}.`);

        const escapedMount = webModule.mount.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const pattern = new RegExp(`^${escapedMount}(?:/.*)?$`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        app.get(pattern, (_: any, res: Res) => {
          res.sendFile(path.resolve(webModule.root, 'index.html'));
        });
      }
    }
  }
}
