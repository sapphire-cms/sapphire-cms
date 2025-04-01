import {ValidationResult, Validator} from '../common/validation';

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

export function parametrizedFieldTypeFactory<
    TypeName extends string,
    TCastTo extends string | number | boolean,
    TParamDefs extends readonly ParamDef[]
>(
    name: TypeName,
    castTo: TCastTo,
    paramDefs: TParamDefs,
    typeValidatorFactory: (params: BuildParams<TParamDefs>) => Validator<TCastTo>
): FieldTypeFactory<TCastTo, BuildParams<TParamDefs>> {
  const createType = (params: BuildParams<TParamDefs>): FieldType<TCastTo, BuildParams<TParamDefs>> => {
    // TODO: validate typeParams against paramDefs

    // TODO: cache types that doesn't need parametrization

    return {
      name,
      castTo,
      params,
      isValueOfType: typeValidatorFactory(params),  // TODO: wrap this validator, need to cast value first
    };
  };

  return {
    name,
    createType,
  };
}

export function simpleFieldTypeFactory<
    TCastTo extends string | number | boolean
>(
    name: string,
    castTo: TCastTo,
    typeValidator?: Validator<any>
): FieldTypeFactory<TCastTo, {}> {
  return parametrizedFieldTypeFactory(
      name,
      castTo,
      [] as const,
      typeValidator
          ? () => typeValidator!
          : () => () => ValidationResult.valid()
  );
}
