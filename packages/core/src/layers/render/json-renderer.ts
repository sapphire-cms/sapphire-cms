import { success, Outcome } from '../../defectless';
import { RenderError } from '../../kernel';
import {
  Artifact,
  Document,
  DocumentContentInlined,
  HydratedContentSchema,
  StoreMap,
} from '../../model';
import { documentSlug, IRenderer } from './renderer';
import { SapphireRenderer } from './renderer-typing';

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
  ): Outcome<Artifact[], RenderError> {
    const slug = documentSlug(document);
    const content = new TextEncoder().encode(JSON.stringify(document.content));

    return success([
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
  ): Outcome<Artifact[], RenderError> {
    const content = new TextEncoder().encode(JSON.stringify(storeMap));

    return success([
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
