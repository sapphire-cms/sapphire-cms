import { AnyParams } from '../../common';
import { Outcome } from '../../defectless';
import { DeliveryError, Layer } from '../../kernel';
import { Artifact, DeliveredArtifact } from '../../model';

export interface DeliveryLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  deliverArtefact(artifact: Artifact): Outcome<DeliveredArtifact, DeliveryError>;
}
