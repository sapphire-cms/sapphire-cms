import {
  Artifact,
  ContentSchema,
  Document,
  documentSlug,
  HydratedContentSchema,
  IRenderer,
  RenderError,
  SapphireRenderer,
  StoreMap,
} from '@sapphire-cms/core';
import * as yaml from 'yaml';
import { okAsync, ResultAsync } from 'neverthrow';

@SapphireRenderer({
  name: 'yaml',
  params: [] as const,
})
export class YamlRenderer implements IRenderer {
  public renderDocument(
    document: Document,
    _contentSchema: ContentSchema,
  ): ResultAsync<Artifact[], RenderError> {
    const slug = documentSlug(document);
    const content = new TextEncoder().encode(yaml.stringify(document.content));

    return okAsync([
      {
        slug,
        createdAt: document.createdAt,
        lastModifiedAt: document.lastModifiedAt,
        mime: 'application/yaml',
        content,
        isMain: true,
      },
    ]);
  }

  public renderStoreMap(
    storeMap: StoreMap,
    _contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError> {
    const content = new TextEncoder().encode(yaml.stringify(storeMap));

    return okAsync([
      {
        slug: 'content-map',
        createdAt: storeMap.createdAt,
        lastModifiedAt: storeMap.lastModifiedAt,
        mime: 'application/yaml',
        content,
        isMain: true,
      },
    ]);
  }
}
