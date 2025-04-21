import {RendererMetadata, SapphireRendererClass} from './render-typing.types';
import {BuildParams, ParamDef} from '../../common';
import {IRenderer} from './renderer';
import {Artifact, Document, DocumentContentInlined, HydratedContentSchema, StoreMap} from '../../model';

const RendererRegistry = new WeakMap<any, RendererMetadata<any>>();

export function SapphireRenderer<
    TParamDefs extends readonly ParamDef[]
>(config: {
  name: string;
  params: TParamDefs;
}) {
  return function <
      T extends new (params: BuildParams<TParamDefs>) => IRenderer
  >(target: T) {
    RendererRegistry.set(target, config);
  };
}

function getRendererMetadataFromClass<
    T extends new (...args: any[]) => any
>(target: T): RendererMetadata<any> | undefined {
  return RendererRegistry.get(target);
}

export class Renderer implements IRenderer {
  constructor(private readonly metadata: RendererMetadata<any>,
              public readonly params: any,
              private readonly instance: IRenderer) {
  }

  public get name(): string {
    return this.metadata.name;
  }

  public renderDocument(document: Document<DocumentContentInlined>, contentSchema: HydratedContentSchema): Promise<Artifact[]> {
    return this.instance.renderDocument(document, contentSchema);
  }

  public renderStoreMap(storeMap: StoreMap, contentSchema: HydratedContentSchema): Promise<Artifact[]> {
    return this.instance.renderStoreMap(storeMap, contentSchema);
  }
}

export class RendererFactory {
  private readonly metadata: RendererMetadata<any>;

  public constructor(private readonly rendererClass: SapphireRendererClass<any>) {
    this.metadata = getRendererMetadataFromClass(rendererClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get params(): ParamDef[] {
    return this.metadata.params;
  }

  public instance(params: any): Renderer {
    return new Renderer(this.metadata, params, new this.rendererClass(params));
  }
}
