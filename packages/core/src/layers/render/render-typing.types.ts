import {ParamDef} from '../../common';
import {IRenderer} from './renderer';

export type RendererMetadata<
    TParamDefs extends readonly ParamDef[]
> = {
  name: string;
  params: TParamDefs;
};

export interface SapphireRendererClass<
    TParamDefs extends readonly ParamDef[]
>{
  new (...args: any[]): IRenderer;
  __rendererMetadata?: RendererMetadata<TParamDefs>;
}
