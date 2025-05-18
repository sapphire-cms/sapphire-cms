import { Outcome } from 'defectless';
import { RenderError } from '../../kernel';
import {
  Artifact,
  Document,
  DocumentContentInlined,
  HydratedContentSchema,
  StoreMap,
} from '../../model';

export interface IRenderer {
  renderDocument(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
  ): Outcome<Artifact[], RenderError>;
  renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): Outcome<Artifact[], RenderError>;
}

export function documentSlug(document: Document<DocumentContentInlined>): string {
  return [document.store, ...document.path, document.id, document.variant].join('/');
}
