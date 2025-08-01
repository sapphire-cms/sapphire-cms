import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { Env, Layer, PlatformError, WebModule } from '../../kernel';
import { HttpLayer } from '../../kernel/http-layer';

export interface PlatformLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  supportedFrameworks: string[];
  getEnv(): Outcome<Env, PlatformError>;
  addRestController(controller: HttpLayer): void;
  addWebModule(webModule: WebModule): void;
  start(): Outcome<void, PlatformError>;
  halt(): Outcome<void, PlatformError>;
}
