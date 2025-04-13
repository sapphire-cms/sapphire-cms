import {Layer} from '../../kernel';
import {Document, RenderedDocument} from '../../common';

export interface RenderLayer<Config> extends Layer<Config> {
  renderDocument(document: Document<any>): Promise<RenderedDocument>;
}
