import { BuildParams, IValidator, ParamDef, UnknownParamDefs } from '../../common';
import {
  FieldValidatorMetadata,
  SapphireFieldValidatorClass,
  ValueType,
} from './fields-validation.types';

const FieldValidatorRegistry = new WeakMap<SapphireFieldValidatorClass, FieldValidatorMetadata>();

export function SapphireFieldValidator<
  TForTypes extends ('string' | 'number' | 'boolean')[] | null = null, // null means all types
  TValueType extends ValueType<TForTypes> = ValueType<TForTypes>,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
>(config: {
  name: string;
  forTypes: TForTypes;
  params: TParamDefs;
}): <T extends new (params: BuildParams<TParamDefs>) => IValidator<TValueType>>(target: T) => void {
  return (target) => {
    FieldValidatorRegistry.set(
      target as unknown as SapphireFieldValidatorClass,
      config as unknown as FieldValidatorMetadata,
    );
  };
}

export function getFieldValidatorMetadataFromClass<T extends SapphireFieldValidatorClass>(
  target: T,
): FieldValidatorMetadata | undefined {
  return FieldValidatorRegistry.get(target);
}
