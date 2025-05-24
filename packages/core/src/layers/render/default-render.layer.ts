import { JsonRenderer } from './json-renderer';
import { RenderLayer } from './render.layer';

export class DefaultRenderLayer implements RenderLayer {
  public readonly rendererFactories = [JsonRenderer];
}
