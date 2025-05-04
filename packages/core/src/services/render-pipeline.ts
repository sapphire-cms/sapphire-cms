import { errAsync, ResultAsync } from 'neverthrow';
import { AnyParams, asyncProgram } from '../common';
import { DeliveryError, RenderError } from '../kernel';
import { DeliveryLayer, IRenderer } from '../layers';
import {
  Artifact,
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
    return asyncProgram(
      function* (this: RenderPipeline): Generator<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ResultAsync<any, RenderError | DeliveryError>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ResultAsync<any, RenderError | DeliveryError> | DeliveredArtifact
      > {
        const artifacts: Artifact[] = yield this.renderer.renderDocument(
          document,
          this.contentSchema,
        );

        const main = artifacts.filter((artifact) => artifact.isMain);
        if (!main.length) {
          return errAsync(new RenderError('Renderer must produce one main artifact.'));
        } else if (main.length > 1) {
          return errAsync(new RenderError('Renderer cannot produce multiple main artifacts.'));
        }

        let mainArtifact: DeliveredArtifact | undefined;

        for (const artifact of artifacts) {
          const deliveredArtifact = yield this.deliveryLayer.deliverArtefact(artifact);
          if (artifact.isMain) {
            mainArtifact = deliveredArtifact;
          }
        }

        return mainArtifact!;
      }.bind(this),
      (defect) => errAsync(new DeliveryError('Defective program', defect)),
    );
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
