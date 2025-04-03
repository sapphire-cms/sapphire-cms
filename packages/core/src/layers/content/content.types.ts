import {ParamTypes, Validator} from '../../common';

// TODO: always cast inputs to one of following Javascript types: string, number, boolean
// TODO: check if can strong type Params like in Module
export interface FieldType<
    TCastTo extends string | number | boolean,
    Params
> {
  name: string;
  castTo: TCastTo;
  params?: Params;
  isValueOfType: Validator<any>;
}

export type FieldTypeFactory<
    TCastTo extends string | number | boolean,
    Params
> = {
  name: string;
  createType: (params: Params) => FieldType<TCastTo, Params>;
}

export interface FieldValueValidator<T> {
  name: string;
  forTypes: ('string' | 'number' | 'boolean')[] | null,    // null means validator can be applied to the field of all types
  params: T;
  validate: Validator<any>;
}

// Helper to map an array of keys to their types
type MapTypeArray<T extends readonly (keyof ParamTypes)[]> =
    ParamTypes[T[number]];

// Final conditional wrapper
export type ValueType<T extends readonly (keyof ParamTypes)[] | null> =
    T extends null
        ? string | number | boolean | null
        : MapTypeArray<Exclude<T, null>>;

export type FieldValueValidatorFactory<T> = (params: T) => FieldValueValidator<T>;
