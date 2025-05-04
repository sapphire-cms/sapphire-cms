import {
  Artifact,
  Document,
  DocumentContentInlined,
  HydratedContentSchema,
  StoreMap,
} from '../../model';
import { documentSlug, IRenderer } from './renderer';
import { SapphireRenderer } from './renderer-typing';
import { okAsync, ResultAsync } from 'neverthrow';
import { RenderError } from '../../kernel';

/**
 * Simply returns the content of the document as JSON.
 */
@SapphireRenderer({
  name: 'json',
  params: [] as const,
})
export class JsonRenderer implements IRenderer {
  public renderDocument(
    document: Document<DocumentContentInlined>,
    _contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError> {
    const slug = documentSlug(document);
    const content = new TextEncoder().encode(JSON.stringify(document.content));

    return okAsync([
      {
        slug,
        createdAt: document.createdAt,
        lastModifiedAt: document.lastModifiedAt,
        mime: 'application/json',
        content,
        isMain: true,
      },
    ]);
  }

  public renderStoreMap(
    storeMap: StoreMap,
    _contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError> {
    const content = new TextEncoder().encode(JSON.stringify(storeMap));

    return okAsync([
      {
        slug: 'content-map',
        createdAt: storeMap.createdAt,
        lastModifiedAt: storeMap.lastModifiedAt,
        mime: 'application/json',
        content,
        isMain: true,
      },
    ]);
  }
}
