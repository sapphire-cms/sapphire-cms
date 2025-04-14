import {RenderLayer} from './render.layer';
import {JsonRenderer} from './json.renderer';

export class DefaultRenderLayer implements RenderLayer<void> {
  public readonly rendererFactories = [
      JsonRenderer,
  ];
}
