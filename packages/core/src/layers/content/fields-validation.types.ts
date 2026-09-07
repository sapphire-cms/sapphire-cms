import { BuildParams, IValidator, ParamDef, UnknownParamDefs, ValueType } from '../../common';

export type FieldValidatorMetadata<
  TForTypes extends ('string' | 'number' | 'boolean')[] | null = null, // null means all types
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
> = {
  name: string;
  forTypes: TForTypes;
  params: TParamDefs;
};

export interface SapphireFieldValidatorClass<
  TForTypes extends ('string' | 'number' | 'boolean')[] | null = null, // null means all types
  TValueType extends ValueType<TForTypes> = ValueType<TForTypes>,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  TParams extends BuildParams<TParamDefs> = BuildParams<TParamDefs>,
> {
  new (params: TParams): IValidator<TValueType>;
  __fieldValidatorMetadata?: FieldValidatorMetadata<TForTypes, TParamDefs>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnySapphireFieldValidatorClass = SapphireFieldValidatorClass<any, any, any, any>;
