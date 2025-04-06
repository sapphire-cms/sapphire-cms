import {FieldTypeMetadata, SapphireFieldTypeClass} from './fields-typing.types';
import {BuildParams, IValidator, ParamDef, ParamTypes} from '../../common';

const FieldTypeRegistry = new WeakMap<any, FieldTypeMetadata<any, any>>();

export function SapphireFieldType<
    TCastTo extends keyof ParamTypes,
    TParamDefs extends readonly ParamDef[]
>(config: {
  name: string;
  castTo: TCastTo;
  example?: string;
  paramDefs: TParamDefs;
}) {
  return function <
      T extends new (params: BuildParams<TParamDefs>) => IValidator<ParamTypes[TCastTo]>
  >(target: T) {
    FieldTypeRegistry.set(target, config);
  };
}

export function getFieldTypeMetadataFromClass<
    T extends new (...args: any[]) => any
>(target: T): FieldTypeMetadata<any, any> | undefined {
  return FieldTypeRegistry.get(target);
}

export function getFieldTypeMetadataFromInstance<
    TCastTo extends string | number | boolean,
    TParamDefs extends readonly ParamDef[]
>(
    instance: IValidator<TCastTo>
): FieldTypeMetadata<TCastTo, TParamDefs> | undefined {
  return getFieldTypeMetadataFromClass(instance.constructor as SapphireFieldTypeClass<TCastTo, TParamDefs>);
}
