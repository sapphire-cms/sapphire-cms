import {AnyParams} from '../../common';
import {Layer} from '../../kernel';
import {Artifact, DeliveredArtifact} from '../../model';

export interface DeliveryLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config> {
  deliverArtefact(artifact: Artifact): Promise<DeliveredArtifact>;
}
