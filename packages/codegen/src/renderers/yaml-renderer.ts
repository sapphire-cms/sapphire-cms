import {Artifact, ContentMap, Document, Renderer, SapphireRenderer} from '@sapphire-cms/core';
import * as yaml from 'yaml';

@SapphireRenderer({
  name: 'yaml',
  paramDefs: [] as const,
})
export class YamlRenderer implements Renderer {
  public renderDocument(document: Document<any>): Promise<Artifact[]> {
    const slug = [
      document.store,
      ...document.path,
      document.id,
      document.variant,
    ].join('/');
    const content = new TextEncoder().encode(yaml.stringify(document.content));

    return Promise.resolve([{
      slug,
      createdAt: document.createdAt,
      lastModifiedAt: document.lastModifiedAt,
      mime: 'application/yaml',
      content,
      isMain: true,
    }]);
  }

  public renderContentMap(contentMap: ContentMap): Promise<Artifact[]> {
    const slug = [ contentMap.store, 'content-map' ].join('/');
    const content = new TextEncoder().encode(yaml.stringify(contentMap));

    return Promise.resolve([{
      slug,
      createdAt: contentMap.createdAt,
      lastModifiedAt: contentMap.lastModifiedAt,
      mime: 'application/yaml',
      content,
      isMain: true,
    }]);
  }
}
