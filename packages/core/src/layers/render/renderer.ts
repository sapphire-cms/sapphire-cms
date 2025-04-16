import {Artifact, ContentMap, Document} from '../../common';
import {ContentSchema} from '../../loadables';
import {SapphireFieldTypeClass} from '../content';

export interface Renderer {
  renderDocument(document: Document<any>): Promise<Artifact[]>;
  renderContentMap(contentMap: ContentMap, contentSchemas: ContentSchema[], fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>): Promise<Artifact[]>;
}
