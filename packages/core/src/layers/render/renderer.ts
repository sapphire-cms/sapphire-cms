import {
  Artifact,
  Document,
  DocumentContentInlined,
  HydratedContentSchema,
  StoreMap,
} from '../../model';
import { ResultAsync } from 'neverthrow';
import { RenderError } from '../../kernel';

export interface IRenderer {
  renderDocument(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError>;
  renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError>;
}

export function documentSlug(document: Document<DocumentContentInlined>): string {
  return [document.store, ...document.path, document.id, document.variant].join('/');
}
