import { AnyParamType, BuildParams, IValidator, ParamDef, UnknownParamDefs } from '../../common';

export type FieldTypeMetadata<
  TCastTo extends AnyParamType = AnyParamType,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
> = {
  name: string;
  castTo: TCastTo; // TODO: create castTo validation for ultimate safety
  params: TParamDefs;
  example?: string;
};

export interface SapphireFieldTypeClass<
  TCastTo extends AnyParamType = AnyParamType,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>,
> {
  new (params: TParams): IValidator<TCastTo>;
  __fieldTypeMetadata?: FieldTypeMetadata<TCastTo, TParamDefs>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySapphireFieldTypeClass = SapphireFieldTypeClass<any, any, any>;
