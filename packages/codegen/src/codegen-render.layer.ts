import {RenderLayer} from '@sapphire-cms/core';
import {YamlRenderer} from './yaml';
import {TypescriptRenderer} from './typescript';

export class CodegenRenderLayer implements RenderLayer<void> {
  public readonly rendererFactories = [
      YamlRenderer,
      TypescriptRenderer,
  ];
}
