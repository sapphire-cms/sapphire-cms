import {Document, RenderedDocument} from '../../common';

export interface Renderer {
  renderDocument(document: Document<any>): Promise<RenderedDocument>;
}
