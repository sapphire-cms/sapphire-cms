import {
  Artifact,
  ContentMap,
  ContentSchema,
  Document,
  documentSlug,
  Renderer,
  SapphireRenderer
} from '@sapphire-cms/core';
import * as yaml from 'yaml';

@SapphireRenderer({
  name: 'yaml',
  paramDefs: [] as const,
})
export class YamlRenderer implements Renderer {
  public renderDocument(document: Document, contentSchema: ContentSchema): Promise<Artifact[]> {
    const slug = documentSlug(document);
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
    const content = new TextEncoder().encode(yaml.stringify(contentMap));

    return Promise.resolve([{
      slug: 'content-map',
      createdAt: contentMap.createdAt,
      lastModifiedAt: contentMap.lastModifiedAt,
      mime: 'application/yaml',
      content,
      isMain: true,
    }]);
  }
}
