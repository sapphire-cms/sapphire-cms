import { AnyParams } from '../common';
import { failure, Outcome, AsyncProgram, asyncProgram } from '../defectless';
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
  ): Outcome<DeliveredArtifact, RenderError | DeliveryError> {
    return asyncProgram(
      function* (): AsyncProgram<DeliveredArtifact, RenderError | DeliveryError> {
        const artifacts: Artifact[] = yield this.renderer.renderDocument(
          document,
          this.contentSchema,
        );

        const main = artifacts.filter((artifact) => artifact.isMain);
        if (!main.length) {
          return failure(new RenderError('Renderer must produce one main artifact.'));
        } else if (main.length > 1) {
          return failure(new RenderError('Renderer cannot produce multiple main artifacts.'));
        }

        let mainArtifact: DeliveredArtifact | undefined;

        for (const artifact of artifacts) {
          const deliveredArtifact = yield this.deliveryLayer.deliverArtefact(artifact);
          if (artifact.isMain) {
            mainArtifact = deliveredArtifact;
          }
        }

        return mainArtifact!;
      },
      (defect) => failure(new DeliveryError('Defective renderDocument program', defect)),
      this,
    );
  }

  public renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): Outcome<DeliveredArtifact[], RenderError | DeliveryError> {
    return this.renderer.renderStoreMap(storeMap, contentSchema).flatMap((mapArtifacts) => {
      const deliverTasks = mapArtifacts.map((mapArtifact) =>
        this.deliveryLayer.deliverArtefact(mapArtifact),
      );

      return Outcome.combine(deliverTasks);
    });
  }
}
