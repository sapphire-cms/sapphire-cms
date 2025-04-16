import {Layer} from '../../kernel';
import {Artifact, DeliveredArtifact} from '../../common';

export interface DeliveryLayer<Config> extends Layer<Config> {
  deliverArtefact(artifact: Artifact): Promise<DeliveredArtifact>;
}
