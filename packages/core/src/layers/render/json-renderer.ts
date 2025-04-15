import {Artifact, ContentMap, Document} from '../../common';
import {Renderer} from './renderer';
import {SapphireRenderer} from './renderer-typing';

/**
 * Simply returns the content of the document as JSON.
 */
@SapphireRenderer({
  name: 'json',
  paramDefs: [] as const,
})
export class JsonRenderer implements Renderer {
  // TODO: inline group fields an think what to do with refereces
  public renderDocument(document: Document<any>): Promise<Artifact[]> {
    const slug = [
        document.store,
        ...document.path,
        document.id,
        document.variant,
    ].join('/');
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

  public renderContentMap(contentMap: ContentMap): Promise<Artifact[]> {
    const slug = [ contentMap.store, 'content-map' ].join('/');
    const content = new TextEncoder().encode(JSON.stringify(contentMap));

    return Promise.resolve([{
      slug,
      createdAt: contentMap.createdAt,
      lastModifiedAt: contentMap.lastModifiedAt,
      mime: 'application/json',
      content,
      isMain: true,
    }]);
  }
}
