import {AnyParams} from '../../common';
import {Env, Layer} from '../../kernel';

export interface PlatformLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config> {
  getEnv(): Promise<Env>;
}
