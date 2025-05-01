import {BuildParams, ParamDef, UnknownParamDefs} from '../../common';
import {IRenderer} from './renderer';

export type RendererMetadata<
    TParamDefs extends readonly ParamDef[] = UnknownParamDefs
> = {
  name: string;
  params: TParamDefs;
};

export interface SapphireRendererClass<
    TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
    TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>
>{
  new (params: TParams): IRenderer;
  __rendererMetadata?: RendererMetadata<TParamDefs>;
}
