import {DeliveryLayer, Renderer} from '../layers';
import {DeliveredArtifact, Document, DocumentContentInlined, HydratedContentSchema, StoreMap} from '../model';

export class RenderPipeline {
  // TODO: add shapers here

  public constructor(public readonly name: string,
                     public readonly contentSchema: HydratedContentSchema,
                     private readonly renderer: Renderer,
                     private readonly deliveryLayer: DeliveryLayer<any>) {
  }

  public async renderDocument(document: Document<DocumentContentInlined>): Promise<DeliveredArtifact> {
    const artifacts = await this.renderer.renderDocument(document, this.contentSchema);

    const main = artifacts.filter(artifact => artifact.isMain);
    if (!main.length) {
      throw new Error('Renderer must produce one main artifact.');
    } else if (main.length > 1) {
      throw new Error('Renderer cannot produce multiple main artifacts.');
    }

    let mainArtifact: DeliveredArtifact | undefined;

    for (const artifact of artifacts) {
      const deliveredArtifact = await this.deliveryLayer.deliverArtefact(artifact);
      if (artifact.isMain) {
        mainArtifact = deliveredArtifact;
      }
    }

    return mainArtifact!;
  }

  public async renderStoreMap(storeMap: StoreMap, contentSchema: HydratedContentSchema): Promise<DeliveredArtifact[]> {
    const mapArtifacts = await this.renderer.renderStoreMap(storeMap, contentSchema);

    return await Promise.all(
        mapArtifacts
            .map(mapArtifact => this.deliveryLayer.deliverArtefact(mapArtifact)));
  }
}
