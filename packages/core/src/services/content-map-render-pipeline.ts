import { Outcome } from 'defectless';
import { AnyParams } from '../common';
import { DeliveryError, RenderError } from '../kernel';
import { DeliveryLayer, IRenderer } from '../layers';
import { Artifact, ContentMap } from '../model';

export class ContentMapRenderPipeline {
  constructor(
    public readonly name: string,
    private readonly renderer: IRenderer,
    private readonly deliveryLayer: DeliveryLayer<AnyParams>,
  ) {}

  public renderContentMap(contentMap: ContentMap): Outcome<void, RenderError | DeliveryError> {
    return this.renderer
      .renderContentMap(contentMap)
      .flatMap((artifacts: Artifact[]) => this.deliveryLayer.deliverArtefacts(artifacts))
      .map(() => {});
  }
}
