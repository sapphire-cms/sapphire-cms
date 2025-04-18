import {Artifact, ContentMap, Document, DocumentContentInlined} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';

export interface Renderer {
  renderDocument(document: Document<DocumentContentInlined>, contentSchema: ContentSchema): Promise<Artifact[]>;
  renderContentMap(contentMap: ContentMap, contentSchemas: ContentSchema[], fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>): Promise<Artifact[]>;
}

export function documentSlug(document: Document<DocumentContentInlined>): string {
  return [
    document.store,
    ...document.path,
    document.id,
    document.variant,
  ].join('/');
}
