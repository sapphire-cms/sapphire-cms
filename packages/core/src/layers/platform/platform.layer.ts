import {Env, Layer} from '../../kernel';

export interface PlatformLayer<Config> extends Layer<Config> {
  getEnv(): Promise<Env>;
}
