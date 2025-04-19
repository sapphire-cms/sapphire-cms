import {FieldTypeMetadata, SapphireFieldTypeClass} from './fields-typing.types';
import {BuildParams, IValidator, ParamDef, ParamTypes, ValidationResult} from '../../common';
import {IFieldType} from '../../model/common/field-type';

const FieldTypeRegistry = new WeakMap<any, FieldTypeMetadata<any, any>>();

export function SapphireFieldType<
    TCastTo extends keyof ParamTypes,
    TParamDefs extends readonly ParamDef[]
>(config: {
  name: string;
  castTo: TCastTo;
  example?: string;
  params: TParamDefs;
}) {
  return function <
      T extends new (params: BuildParams<TParamDefs>) => IValidator<ParamTypes[TCastTo]>
  >(target: T) {
    FieldTypeRegistry.set(target, config);
  };
}

function getFieldTypeMetadataFromClass<
    T extends new (...args: any[]) => any
>(target: T): FieldTypeMetadata<any, any> | undefined {
  return FieldTypeRegistry.get(target);
}

export class FieldType<T extends string | number | boolean> implements IFieldType<T> {
  constructor(private readonly metadata: FieldTypeMetadata<any, any>,
              public readonly params: any,
              private readonly instance: IValidator<T>) {
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get castTo(): 'string' | 'number' | 'boolean' {
    return this.metadata.castTo;
  }

  public get example(): string | undefined {
    return this.metadata.example;
  }

  public validate(value: T): ValidationResult {
    return this.instance.validate(value);
  }
}

export class FieldTypeFactory {
  private readonly metadata: FieldTypeMetadata<any, any>;

  public constructor(private readonly fieldTypeClass: SapphireFieldTypeClass<any, any>) {
    this.metadata = getFieldTypeMetadataFromClass(fieldTypeClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get castTo(): 'string' | 'number' | 'boolean' {
    return this.metadata.castTo;
  }

  public get params(): ParamDef[] {
    return this.metadata.params;
  }

  public get example(): string | undefined {
    return this.metadata.example;
  }

  public instance<T extends string | number | boolean>(params: any): FieldType<T> {
    return new FieldType<T>(this.metadata, params, new this.fieldTypeClass(params));
  }
}
