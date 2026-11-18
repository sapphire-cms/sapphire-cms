import { Outcome, success } from 'defectless';
import { asSlug, RenderError, slug } from '../../kernel';
import {
  Artifact,
  ContentMap,
  Document,
  DocumentContentInlined,
  documentRef,
  HydratedContentSchema,
  StoreMap,
} from '../../model';
import { IRenderer } from './renderer';
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
    const slug = documentRef(document).toSlug();
    const content = new TextEncoder().encode(JSON.stringify(document.content));

    return success([
      {
        slug,
        createdAt: document.createdAt,
        lastModifiedAt: document.lastModifiedAt,
        mime: 'application/json',
        extension: 'json',
        encoding: 'utf-8',
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
        slug: asSlug(storeMap.store),
        createdAt: storeMap.createdAt,
        lastModifiedAt: storeMap.lastModifiedAt,
        mime: 'application/json',
        extension: 'json',
        encoding: 'utf-8',
        content,
        isMain: true,
      },
    ]);
  }

  public renderContentMap(contentMap: ContentMap): Outcome<Artifact[], RenderError> {
    const content = new TextEncoder().encode(JSON.stringify(contentMap));

    return success([
      {
        slug: slug`content-map`,
        createdAt: contentMap.createdAt,
        lastModifiedAt: contentMap.lastModifiedAt,
        mime: 'application/json',
        extension: 'json',
        encoding: 'utf-8',
        content,
        isMain: true,
      },
    ]);
  }
}
