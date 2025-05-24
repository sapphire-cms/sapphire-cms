import { RenderLayer } from '@sapphire-cms/core';
import { TypescriptRenderer } from './typescript';
import { YamlRenderer } from './yaml';

export class CodegenRenderLayer implements RenderLayer {
  public readonly rendererFactories = [YamlRenderer, TypescriptRenderer];
}
