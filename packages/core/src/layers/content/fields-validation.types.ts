import {ParamTypes, Validator} from '../../common';

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
