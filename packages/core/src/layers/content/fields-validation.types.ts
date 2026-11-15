import { BuildParams, IValidator, MapTypeArray, ParamDef, UnknownParamDefs } from '../../common';

export type FieldValidatorMetadata<
  TForTypes extends ('string' | 'number' | 'boolean')[] = [],
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
> = {
  name: string;
  forTypes: TForTypes;
  params: TParamDefs;
};

export interface SapphireFieldValidatorClass<
  TForTypes extends ('string' | 'number' | 'boolean')[] = [],
  TValueType extends MapTypeArray<TForTypes> = MapTypeArray<TForTypes>,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>,
> {
  new (params: TParams): IValidator<TValueType>;
  __fieldValidatorMetadata?: FieldValidatorMetadata<TForTypes, TParamDefs>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySapphireFieldValidatorClass = SapphireFieldValidatorClass<any, any, any, any>;
