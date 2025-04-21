import {Layer} from '../../kernel';
import {SapphireRendererClass} from './render-typing.types';

export interface RenderLayer<Config> extends Layer<Config> {
  rendererFactories?: SapphireRendererClass<any>[];
}
