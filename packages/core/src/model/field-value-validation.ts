import {Validator} from '../common/validation';

type ParamTypes = {
  string: string;
  number: number;
  boolean: boolean;
};

type ParamDef<Name extends string = string> = {
  name: Name;
  type: keyof ParamTypes;
  required?: boolean;
  isList?: boolean;
};

type ResolveParamType<F extends ParamDef> =
    F['isList'] extends true
        ? ParamTypes[F['type']][]
        : ParamTypes[F['type']];

type BuildParams<T extends readonly ParamDef[]> = {
  [K in T[number] as K['name']]: K extends ParamDef ? ResolveParamType<K> : never;
};

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
type ValueType<T extends readonly (keyof ParamTypes)[] | null> =
    T extends null
        ? string | number | boolean | null
        : MapTypeArray<Exclude<T, null>>;

export type FieldValueValidatorFactory<T> = (params: T) => FieldValueValidator<T>;

export function parametrizedFieldValidatorFactory<
    ValidatorName extends string,
    TForTypes extends ('string' | 'number' | 'boolean')[] | null,
    TValueType extends ValueType<TForTypes>,
    TParamDefs extends readonly ParamDef[]
>(
  validatorName: ValidatorName,
  forTypes: TForTypes,
  params: TParamDefs,
  valueValidatorFactory: (params: BuildParams<TParamDefs>) => Validator<TValueType>
): (params: BuildParams<TParamDefs>) => FieldValueValidator<BuildParams<TParamDefs>> {
  return (params: BuildParams<TParamDefs>) => {
    // TODO: validate typeParams against paramDefs

    return {
      name: validatorName,
      forTypes,
      params,
      validate: valueValidatorFactory(params),
    };
  };
}
