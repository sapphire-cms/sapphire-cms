import {Artifact, ContentMap, Document} from '../../common';

export interface Renderer {
  renderDocument(document: Document<any>): Promise<Artifact[]>;
  renderContentMap(contentMap: ContentMap): Promise<Artifact[]>;
}
