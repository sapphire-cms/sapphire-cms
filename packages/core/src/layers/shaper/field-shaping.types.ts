import { Outcome } from 'defectless';
import { AnyParamType, BuildParams, MapTypeArray, ParamDef, UnknownParamDefs } from '../../common';
import { ShaperError } from '../../kernel';

export interface ITransformer<I, O> {
  transform(input: I): Outcome<O, ShaperError>;
}

export type FieldShaperMetadata<
  TForTypes extends ('string' | 'number' | 'boolean')[] = [],
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
> = {
  name: string;
  forTypes: TForTypes;
  params: TParamDefs;
};

export interface SapphireFieldShaperClass<
  TForTypes extends ('string' | 'number' | 'boolean')[] = [],
  TValueType extends MapTypeArray<TForTypes> = MapTypeArray<TForTypes>,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>,
  Output extends AnyParamType = AnyParamType,
> {
  new (params: TParams): ITransformer<TValueType, Output>;
  __fieldShaperMetadata?: FieldShaperMetadata<TForTypes, TParamDefs>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySapphireFieldShaperClass = SapphireFieldShaperClass<any, any, any, any, any>;
