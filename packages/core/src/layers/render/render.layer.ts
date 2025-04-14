import {Layer} from '../../kernel';
import {SapphireRendererClass} from './render-typing.types';

export interface RenderLayer<Config> extends Layer<Config> {
  rendererFactories?: SapphireRendererClass<any>[];
}

export function mergeRenderLayers(renderLayers: RenderLayer<any>[]): RenderLayer<any> {
  const merged: RenderLayer<any> = {
    rendererFactories: [],
  };

  for (const renderLayer of renderLayers) {
    merged.rendererFactories!.push(...(renderLayer.rendererFactories || []));
  }

  return merged;
}
