import { ResultAsync } from 'neverthrow';
import { AnyParams, BuildParams, ParamDef, UnknownParamDefs } from '../../common';
import { RenderError } from '../../kernel';
import {
  Artifact,
  Document,
  DocumentContentInlined,
  HydratedContentSchema,
  StoreMap,
} from '../../model';
import { RendererMetadata, SapphireRendererClass } from './render-typing.types';
import { IRenderer } from './renderer';

const RendererRegistry = new WeakMap<SapphireRendererClass, RendererMetadata>();

export function SapphireRenderer<
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
>(config: {
  name: string;
  params: TParamDefs;
}): <T extends new (params: BuildParams<TParamDefs>) => IRenderer>(target: T) => void {
  return (target) => {
    RendererRegistry.set(target, config);
  };
}

function getRendererMetadataFromClass<T extends SapphireRendererClass>(
  target: T,
): RendererMetadata | undefined {
  return RendererRegistry.get(target);
}

export class Renderer implements IRenderer {
  constructor(
    private readonly metadata: RendererMetadata,
    public readonly params: AnyParams,
    private readonly instance: IRenderer,
  ) {}

  public get name(): string {
    return this.metadata.name;
  }

  public renderDocument(
    document: Document<DocumentContentInlined>,
    contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError> {
    return this.instance.renderDocument(document, contentSchema);
  }

  public renderStoreMap(
    storeMap: StoreMap,
    contentSchema: HydratedContentSchema,
  ): ResultAsync<Artifact[], RenderError> {
    return this.instance.renderStoreMap(storeMap, contentSchema);
  }
}

export class RendererFactory {
  private readonly metadata: RendererMetadata;

  constructor(private readonly rendererClass: SapphireRendererClass) {
    this.metadata = getRendererMetadataFromClass(rendererClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get params(): UnknownParamDefs {
    return this.metadata.params;
  }

  public instance(params: AnyParams): Renderer {
    return new Renderer(
      this.metadata,
      params,
      new this.rendererClass(params as BuildParams<UnknownParamDefs>),
    );
  }
}
