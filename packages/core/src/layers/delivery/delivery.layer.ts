import {Layer} from '../../kernel';
import {Artifact, ContentMap, DeliveredArtifact} from '../../common';

export interface DeliveryLayer<Config> extends Layer<Config> {
  deliverArtefact(artifact: Artifact): Promise<DeliveredArtifact>;

  // TODO: probably should be moved to persistence layer
  fetchContentMap(): Promise<ContentMap | undefined>;
  updateContentMap(contentMap: ContentMap): Promise<void>;
}
