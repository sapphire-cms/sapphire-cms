import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { Env, Layer, PlatformError } from '../../kernel';

export interface PlatformLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  getEnv(): Outcome<Env, PlatformError>;
}
