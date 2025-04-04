import {IValidator, ParamDef, ParamTypes} from '../../common';

export type FieldValidatorMetadata<
    TForTypes extends ('string' | 'number' | 'boolean')[] | null, // null means all types
    TParamDefs extends readonly ParamDef[]
> = {
  name: string;
  forTypes: TForTypes;
  paramDefs: TParamDefs;
};

// Helper to map an array of keys to their types
type MapTypeArray<T extends readonly (keyof ParamTypes)[]> =
    ParamTypes[T[number]];

// Final conditional wrapper
export type ValueType<T extends readonly (keyof ParamTypes)[] | null> =
    T extends null
        ? string | number | boolean | null
        : MapTypeArray<Exclude<T, null>>;

export interface SapphireFieldValidatorClass<
    TForTypes extends ('string' | 'number' | 'boolean')[] | null, // null means all types
    TValueType extends ValueType<TForTypes>,
    TParamDefs extends readonly ParamDef[]
>{
  new (...args: any[]): IValidator<TValueType>;
  __fieldValidatorMetadata?: FieldValidatorMetadata<TForTypes, TParamDefs>;
}
