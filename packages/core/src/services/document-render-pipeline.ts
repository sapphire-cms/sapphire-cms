import { failure, Outcome, Program, program, success, SyncOutcome, SyncProgram } from 'defectless';
import { AnyParams } from '../common';
import { CoreCmsError, DeliveryError, ModuleReference, RenderError, ShaperError } from '../kernel';
import { DeliveryLayer, IRenderer, RendererFactory } from '../layers';
import {
  Artifact,
  DeliveredArtifact,
  Document,
  DocumentContentInlined,
  DocumentShapingError,
  HydratedContentSchema,
  PipelineSchema,
  StoreMap,
  UnknownContentTypeError,
  UnknownDeliveryLayerError,
  UnknownDocumentShaperError,
  UnknownRendererError,
} from '../model';
import { DocumentShaper } from './document-shaper';

export class DocumentRenderPipeline {
  public static create(
    pipelineSchema: PipelineSchema,
    publicHydratedContentSchemas: Map<string, HydratedContentSchema>,
    rendererFactories: Map<ModuleReference, RendererFactory>,
    deliveryLayers: Map<ModuleReference, DeliveryLayer<AnyParams>>,
    documentShapers: Map<string, DocumentShaper>,
  ): SyncOutcome<
    DocumentRenderPipeline,
    | UnknownContentTypeError
    | UnknownRendererError
    | UnknownDocumentShaperError
    | UnknownDeliveryLayerError
    | CoreCmsError
  > {
    return program(function* (): SyncProgram<
      DocumentRenderPipeline,
      | UnknownContentTypeError
      | UnknownRendererError
      | UnknownDocumentShaperError
      | UnknownDeliveryLayerError
      | CoreCmsError
    > {
      const contentSchema = publicHydratedContentSchemas.get(pipelineSchema.source);
      if (!contentSchema) {
        return failure(new UnknownContentTypeError(pipelineSchema.source));
      }

      const rendererFactory = rendererFactories.get(pipelineSchema.render.name as ModuleReference);
      if (!rendererFactory) {
        return failure(new UnknownRendererError(pipelineSchema.render.name));
      }

      const renderer = yield Outcome.fromSupplier(
        () => rendererFactory.instance(pipelineSchema.render.params),
        (err) =>
          new CoreCmsError(`Failed to instantiate renderer ${pipelineSchema.render.name}`, err),
      );

      const deliveryLayer = deliveryLayers.get(pipelineSchema.target as ModuleReference);
      if (!deliveryLayer) {
        return failure(new UnknownDeliveryLayerError(pipelineSchema.target));
      }

      const shapers: DocumentShaper[] = [];

      for (const shaperName of pipelineSchema.shapers) {
        const shaper = documentShapers.get(shaperName);

        if (!shaper) {
          return failure(new UnknownDocumentShaperError(shaperName));
        }

        shapers.push(shaper);
      }

      return success(
        new DocumentRenderPipeline(
          pipelineSchema.name,
          contentSchema,
          renderer,
          shapers,
          deliveryLayer,
        ),
      );
    });
  }

  private constructor(
    public readonly name: string,
    public readonly contentSchema: HydratedContentSchema,
    private readonly renderer: IRenderer,
    private readonly documentShapers: DocumentShaper[],
    private readonly deliveryLayer: DeliveryLayer<AnyParams>,
  ) {}

  public renderDocument(
    document: Document<DocumentContentInlined>,
  ): Outcome<DeliveredArtifact, DocumentShapingError | ShaperError | RenderError | DeliveryError> {
    return program(function* (): Program<
      DeliveredArtifact,
      DocumentShapingError | ShaperError | RenderError | DeliveryError
    > {
      let shaped: DocumentContentInlined = document.content;

      for (const shaper of this.documentShapers) {
        shaped = yield shaper.shapeDocument(shaped);
      }

      document.content = shaped;

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

      const deliveredArtifacts: DeliveredArtifact[] =
        yield this.deliveryLayer.deliverArtefacts(artifacts);
      const mainArtifact: DeliveredArtifact | undefined = deliveredArtifacts.find(
        (deliveredArtifact) => deliveredArtifact.isMain,
      );

      return mainArtifact!;
    }, this);
  }

  public renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): Outcome<DeliveredArtifact[], RenderError | DeliveryError> {
    return program(function* (): Program<DeliveredArtifact[], RenderError | DeliveryError> {
      const artifacts: Artifact[] = yield this.renderer.renderStoreMap(storeMap, contentSchema);
      return this.deliveryLayer.deliverArtefacts(artifacts);
    }, this);
  }
}
