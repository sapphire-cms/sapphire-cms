import { Outcome } from 'defectless';
import { AnyParams } from '../../common';
import { DeliveryError, Layer } from '../../kernel';
import { Artifact, DeliveredArtifact } from '../../model';

export interface DeliveryLayer<Config extends AnyParams | undefined = undefined>
  extends Layer<Config> {
  deliverArtefacts(artifacts: Artifact[]): Outcome<DeliveredArtifact[], DeliveryError>;
}
