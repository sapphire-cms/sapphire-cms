import {RenderLayer} from './render.layer';
import {RenderedDocument, Document, DocumentReference} from '../../common';

/**
 * Simply returns the content of the document as JSON.
 */
export class RawRenderLayer implements RenderLayer<void> {
  // TODO: inline group fields an think what to do with refereces
  public renderDocument(document: Document<any>): Promise<RenderedDocument> {
    const ref = new DocumentReference(document.store, document.path, document.id, document.variant);
    const content = new TextEncoder().encode(JSON.stringify(document.content));

    return Promise.resolve({
      ref,
      createdAt: document.createdAt,
      lastModifiedAt: document.lastModifiedAt,
      mime: 'application/json',
      content,
    });
  }
}
