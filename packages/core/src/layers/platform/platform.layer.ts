import { ResultAsync } from 'neverthrow';
import { AnyParams } from '../../common';
import { Env, Layer, PlatformError } from '../../kernel';

export interface PlatformLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  getEnv(): ResultAsync<Env, PlatformError>;
}
