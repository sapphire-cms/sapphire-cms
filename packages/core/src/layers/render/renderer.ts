import {Artifact, Document, DocumentContentInlined, HydratedContentSchema, StoreMap} from '../../model';

export interface Renderer {
  renderDocument(document: Document<DocumentContentInlined>, contentSchema: HydratedContentSchema): Promise<Artifact[]>;
  renderStoreMap(storeMap: StoreMap, contentSchema: HydratedContentSchema): Promise<Artifact[]>;
}

export function documentSlug(document: Document<DocumentContentInlined>): string {
  return [
    document.store,
    ...document.path,
    document.id,
    document.variant,
  ].join('/');
}
