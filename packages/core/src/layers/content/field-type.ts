import {BuildParams, ParamDef, ValidationResult, Validator} from '../../common';
import {FieldType, FieldTypeFactory} from './content.types';

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
