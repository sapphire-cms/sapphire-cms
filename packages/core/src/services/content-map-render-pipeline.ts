import { failure, Outcome, program, success, SyncOutcome, SyncProgram } from 'defectless';
import { AnyParams } from '../common';
import { CoreCmsError, DeliveryError, ModuleReference, RenderError } from '../kernel';
import { DeliveryLayer, IRenderer, RendererFactory } from '../layers';
import {
  Artifact,
  ContentMap,
  PipelineSchema,
  UnknownContentTypeError,
  UnknownDeliveryLayerError,
  UnknownRendererError,
} from '../model';

export class ContentMapRenderPipeline {
  public static create(
    pipelineSchema: PipelineSchema,
    rendererFactories: Map<ModuleReference, RendererFactory>,
    deliveryLayers: Map<ModuleReference, DeliveryLayer<AnyParams>>,
  ): SyncOutcome<
    ContentMapRenderPipeline,
    UnknownContentTypeError | UnknownRendererError | UnknownDeliveryLayerError | CoreCmsError
  > {
    return program(function* (): SyncProgram<
      ContentMapRenderPipeline,
      UnknownContentTypeError | UnknownRendererError | UnknownDeliveryLayerError | CoreCmsError
    > {
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

      return success(new ContentMapRenderPipeline(pipelineSchema.name, renderer, deliveryLayer));
    });
  }

  private constructor(
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
