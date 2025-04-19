import {RendererMetadata} from './render-typing.types';
import {BuildParams, ParamDef} from '../../common';
import {Renderer} from './renderer';

const RendererRegistry = new WeakMap<any, RendererMetadata<any>>();

export function SapphireRenderer<
    TParamDefs extends readonly ParamDef[]
>(config: {
  name: string;
  params: TParamDefs;
}) {
  return function <
      T extends new (params: BuildParams<TParamDefs>) => Renderer
  >(target: T) {
    RendererRegistry.set(target, config);
  };
}

export function getRendererMetadataFromClass<
    T extends new (...args: any[]) => any
>(target: T): RendererMetadata<any> | undefined {
  return RendererRegistry.get(target);
}

// export function getRendererMetadataFromInstance<
//     TParamDefs extends readonly ParamDef[]
// >(
//     instance: Renderer
// ): RendererMetadata<TParamDefs> | undefined {
//   return getRendererMetadataFromClass(instance.constructor as SapphireRendererClass<TParamDefs>);
// }
