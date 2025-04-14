import {RenderLayer} from '@sapphire-cms/core';
import {YamlRenderer} from './renderers';

export class CodegenRenderLayer implements RenderLayer<void> {
  public readonly rendererFactories = [
      YamlRenderer,
  ];
}
