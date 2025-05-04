import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { AnyParams } from '../common';
import { DeliveryError, RenderError } from '../kernel';
import { DeliveryLayer, IRenderer } from '../layers';
import {
  DeliveredArtifact,
  Document,
  DocumentContentInlined,
  HydratedContentSchema,
  StoreMap,
} from '../model';

export class RenderPipeline {
  // TODO: add shapers here

  constructor(
    public readonly name: string,
    public readonly contentSchema: HydratedContentSchema,
    private readonly renderer: IRenderer,
    private readonly deliveryLayer: DeliveryLayer<AnyParams>,
  ) {}

  public renderDocument(
    document: Document<DocumentContentInlined>,
  ): ResultAsync<DeliveredArtifact, RenderError | DeliveryError> {
    return this.renderer.renderDocument(document, this.contentSchema).andThen((artifacts) => {
      const main = artifacts.filter((artifact) => artifact.isMain);
      if (!main.length) {
        return errAsync(new RenderError('Renderer must produce one main artifact.'));
      } else if (main.length > 1) {
        return errAsync(new RenderError('Renderer cannot produce multiple main artifacts.'));
      }

      const deliverTasks = artifacts.map((artifact) =>
        this.deliveryLayer.deliverArtefact(artifact),
      );
      return ResultAsync.combine(deliverTasks).andThen<
        DeliveredArtifact,
        RenderError | DeliveryError
      >((deliveredArtifacts) => {
        for (const deliveredArtifact of deliveredArtifacts) {
          if (deliveredArtifact.isMain) {
            return okAsync(deliveredArtifact);
          }
        }

        // TODO: just to make compiler happy
        return okAsync(deliveredArtifacts[0]);
      });
    });

    // const artifacts = this.renderer.renderDocument(document, this.contentSchema);
    //
    // const main = artifacts.filter((artifact) => artifact.isMain);
    // if (!main.length) {
    //   throw new Error('Renderer must produce one main artifact.');
    // } else if (main.length > 1) {
    //   throw new Error('Renderer cannot produce multiple main artifacts.');
    // }
    //
    // let mainArtifact: DeliveredArtifact | undefined;
    //
    // for (const artifact of artifacts) {
    //   const deliveredArtifact = await this.deliveryLayer.deliverArtefact(artifact);
    //   if (artifact.isMain) {
    //     mainArtifact = deliveredArtifact;
    //   }
    // }
    //
    // return mainArtifact!;
  }

  public renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): ResultAsync<DeliveredArtifact[], RenderError | DeliveryError> {
    return this.renderer.renderStoreMap(storeMap, contentSchema).andThen((mapArtifacts) => {
      const deliverTasks = mapArtifacts.map((mapArtifact) =>
        this.deliveryLayer.deliverArtefact(mapArtifact),
      );

      return ResultAsync.combine(deliverTasks);
    });
  }
}
