import { ShaperLayer } from '@sapphire-cms/core';
import { MdToHtmlShaper } from './html/md-to-html.shaper';

export class CodegenShaperLayer implements ShaperLayer {
  public readonly fieldShaperFactories = [MdToHtmlShaper];
}
