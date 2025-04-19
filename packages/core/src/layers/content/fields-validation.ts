import {FieldValidatorMetadata, SapphireFieldValidatorClass, ValueType} from './fields-validation.types';
import {BuildParams, IValidator, ParamDef} from '../../common';

const FieldValidatorRegistry = new WeakMap<any, FieldValidatorMetadata<any, any>>();

export function SapphireFieldValidator<
    TForTypes extends ('string' | 'number' | 'boolean')[] | null, // null means all types
    TValueType extends ValueType<TForTypes>,
    TParamDefs extends readonly ParamDef[]
>(config: {
  name: string;
  forTypes: TForTypes;
  params: TParamDefs;
}) {
  return function <
      T extends new (params: BuildParams<TParamDefs>) => IValidator<TValueType>
  >(target: T) {
    FieldValidatorRegistry.set(target, config);
  };
}

export function getFieldValidatorMetadataFromClass<
    T extends new (...args: any[]) => any
>(target: T): FieldValidatorMetadata<any, any> | undefined {
  return FieldValidatorRegistry.get(target);
}

export function getFieldValidatorMetadataFromInstance<
    TForTypes extends ('string' | 'number' | 'boolean')[] | null, // null means all types
    TValueType extends ValueType<TForTypes>,
    TParamDefs extends readonly ParamDef[]
>(
    instance: IValidator<TValueType>
): FieldValidatorMetadata<TForTypes, TParamDefs> | undefined {
  return getFieldValidatorMetadataFromClass(
      instance.constructor as SapphireFieldValidatorClass<TForTypes, TValueType, TParamDefs>
  );
}
