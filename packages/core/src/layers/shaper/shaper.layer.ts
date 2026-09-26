import { AnyParams } from '../../common';
import { Layer } from '../../kernel';
import { DocumentShaper } from './document-shaper';
import { AnySapphireFieldShaperClass } from './field-shaping.types';

export interface ShaperLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  fieldShaperFactories: AnySapphireFieldShaperClass[];
  documentShapers: Map<string, DocumentShaper>;
}
