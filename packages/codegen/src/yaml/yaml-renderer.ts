import {
  Artifact,
  ContentSchema,
  Document,
  documentSlug, HydratedContentSchema,
  Renderer,
  SapphireRenderer, StoreMap
} from '@sapphire-cms/core';
import * as yaml from 'yaml';

@SapphireRenderer({
  name: 'yaml',
  params: [] as const,
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

  public renderStoreMap(storeMap: StoreMap, contentSchema: HydratedContentSchema): Promise<Artifact[]> {
    const content = new TextEncoder().encode(yaml.stringify(storeMap));

    return Promise.resolve([{
      slug: 'content-map',
      createdAt: storeMap.createdAt,
      lastModifiedAt: storeMap.lastModifiedAt,
      mime: 'application/yaml',
      content,
      isMain: true,
    }]);
  }
}
