import {AnyParams} from '../../common';
import {Layer} from '../../kernel';
import {SapphireRendererClass} from './render-typing.types';

export interface RenderLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config> {
  rendererFactories?: SapphireRendererClass[];
}
