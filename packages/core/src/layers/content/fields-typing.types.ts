import {IValidator, ParamDef} from '../../common';

export type FieldTypeMetadata<
    TCastTo extends string | number | boolean,
    TParamDefs extends readonly ParamDef[]
> = {
  name: string;
  castTo: TCastTo;
  paramDefs: TParamDefs;
  example?: string;
};

export interface SapphireFieldTypeClass<
    TCastTo extends string | number | boolean,
    TParamDefs extends readonly ParamDef[]
>{
  new (...args: any[]): IValidator<TCastTo>;
  __fieldTypeMetadata?: FieldTypeMetadata<TCastTo, TParamDefs>;
}
