import {Artifact, Document, DocumentContentInlined, HydratedContentSchema, StoreMap} from '../../model';
import {documentSlug, IRenderer} from './renderer';
import {SapphireRenderer} from './renderer-typing';

/**
 * Simply returns the content of the document as JSON.
 */
@SapphireRenderer({
  name: 'json',
  params: [] as const,
})
export class JsonRenderer implements IRenderer {
  public renderDocument(document: Document<DocumentContentInlined>, _contentSchema: HydratedContentSchema): Promise<Artifact[]> {
    const slug = documentSlug(document);
    const content = new TextEncoder().encode(JSON.stringify(document.content));

    return Promise.resolve([{
      slug,
      createdAt: document.createdAt,
      lastModifiedAt: document.lastModifiedAt,
      mime: 'application/json',
      content,
      isMain: true,
    }]);
  }

  public renderStoreMap(storeMap: StoreMap, _contentSchema: HydratedContentSchema): Promise<Artifact[]> {
    const content = new TextEncoder().encode(JSON.stringify(storeMap));

    return Promise.resolve([{
      slug: 'content-map',
      createdAt: storeMap.createdAt,
      lastModifiedAt: storeMap.lastModifiedAt,
      mime: 'application/json',
      content,
      isMain: true,
    }]);
  }
}
