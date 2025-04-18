import {DeliveryLayer, Renderer, SapphireFieldTypeClass} from '../layers';
import {ContentMap, ContentSchema, DeliveredArtifact, Document, DocumentContentInlined} from '../common';

export class RenderPipeline {
  // TODO: add shapers here

  public constructor(public readonly name: string,
                     public readonly contentSchema: ContentSchema,
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

  public async renderContentMap(contentMap: ContentMap, contentSchemas: ContentSchema[], fieldTypeFactories: Map<string, SapphireFieldTypeClass<any, any>>): Promise<void> {
    const contentMapArtifacts = await this.renderer.renderContentMap(
        contentMap,
        contentSchemas,
        fieldTypeFactories);

    await Promise.all(
        contentMapArtifacts
            .map(mapArtifact => this.deliveryLayer.deliverArtefact(mapArtifact)));
  }
}
