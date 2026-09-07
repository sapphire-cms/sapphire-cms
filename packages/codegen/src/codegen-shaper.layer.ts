import { ShaperLayer } from '@sapphire-cms/core';
import { Md2HtmlShaper } from './html/md2html.shaper';

export class CodegenShaperLayer implements ShaperLayer {
  public readonly fieldShaperFactories = [Md2HtmlShaper];
}
