import {FieldValueValidator, ValueType} from './fields-validation.types';
import {BuildParams, ParamDef, Validator} from '../../common';

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
