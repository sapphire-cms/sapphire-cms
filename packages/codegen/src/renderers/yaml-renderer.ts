import {Document, DocumentReference, RenderedDocument, Renderer, SapphireRenderer} from '@sapphire-cms/core';
import * as yaml from 'yaml';

@SapphireRenderer({
  name: 'yaml',
  paramDefs: [] as const,
})
export class YamlRenderer implements Renderer {
  public renderDocument(document: Document<any>): Promise<RenderedDocument> {
    const ref = new DocumentReference(document.store, document.path, document.id, document.variant);
    const content = new TextEncoder().encode(yaml.stringify(document.content));

    return Promise.resolve({
      ref,
      createdAt: document.createdAt,
      lastModifiedAt: document.lastModifiedAt,
      mime: 'application/yaml',
      content,
    });
  }
}
