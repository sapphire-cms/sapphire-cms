import {ParamDef} from '../../common';
import {Renderer} from './renderer';

export type RendererMetadata<
    TParamDefs extends readonly ParamDef[]
> = {
  name: string;
  params: TParamDefs;
};

export interface SapphireRendererClass<
    TParamDefs extends readonly ParamDef[]
>{
  new (...args: any[]): Renderer;
  __rendererMetadata?: RendererMetadata<TParamDefs>;
}
