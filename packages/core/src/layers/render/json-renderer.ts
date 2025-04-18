import {Artifact, ContentMap, Document, DocumentContentInlined} from '../../common';
import {documentSlug, Renderer} from './renderer';
import {SapphireRenderer} from './renderer-typing';
import {ContentSchema} from '../../loadables';

/**
 * Simply returns the content of the document as JSON.
 */
@SapphireRenderer({
  name: 'json',
  paramDefs: [] as const,
})
export class JsonRenderer implements Renderer {
  public renderDocument(document: Document<DocumentContentInlined>, contentSchema: ContentSchema): Promise<Artifact[]> {
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

  public renderContentMap(contentMap: ContentMap, contentSchemas: ContentSchema[]): Promise<Artifact[]> {
    const content = new TextEncoder().encode(JSON.stringify(contentMap));

    return Promise.resolve([{
      slug: 'content-map',
      createdAt: contentMap.createdAt,
      lastModifiedAt: contentMap.lastModifiedAt,
      mime: 'application/json',
      content,
      isMain: true,
    }]);
  }
}
