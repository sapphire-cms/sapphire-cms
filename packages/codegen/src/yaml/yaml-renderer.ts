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
import { Outcome, success } from 'defectless';
import * as yaml from 'yaml';

@SapphireRenderer({
  name: 'yaml',
  params: [] as const,
})
export class YamlRenderer implements IRenderer {
  public renderDocument(
    document: Document,
    _contentSchema: ContentSchema,
  ): Outcome<Artifact[], RenderError> {
    const slug = documentSlug(document);
    const content = new TextEncoder().encode(yaml.stringify(document.content));

    return success([
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
  ): Outcome<Artifact[], RenderError> {
    const content = new TextEncoder().encode(yaml.stringify(storeMap));

    return success([
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
