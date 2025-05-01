import {
  AnyParams,
  AnyParamType,
  BuildParams,
  IValidator,
  ParamDef,
  ParamTypes,
  UnknownParamDefs,
  ValidationResult
} from '../../common';
import {IFieldType} from '../../model';
import {FieldTypeMetadata, SapphireFieldTypeClass} from './fields-typing.types';

const FieldTypeRegistry = new WeakMap<
    SapphireFieldTypeClass,
    FieldTypeMetadata
>();

export function SapphireFieldType<
    TCastTo extends keyof ParamTypes,
    TParamDefs extends readonly ParamDef[]
>(config: {
  name: string;
  castTo: TCastTo;
  example?: string;
  params: TParamDefs;
}): <T extends new (params: BuildParams<TParamDefs>) => IValidator<ParamTypes[TCastTo]>>(target: T) => void  {
  return target => {
    FieldTypeRegistry.set(
        target as unknown as SapphireFieldTypeClass,
        config as unknown as FieldTypeMetadata);
  };
}

function getFieldTypeMetadataFromClass<
    T extends SapphireFieldTypeClass
>(target: T): FieldTypeMetadata | undefined {
  return FieldTypeRegistry.get(target);
}

export class FieldType<T extends AnyParamType = AnyParamType> implements IFieldType<T> {
  constructor(private readonly metadata: FieldTypeMetadata<T>,
              public readonly params: AnyParams,
              private readonly instance: IValidator<T>) {
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get castTo(): 'string' | 'number' | 'boolean' {
    return this.metadata.castTo as 'string' | 'number' | 'boolean';
  }

  public get example(): string | undefined {
    return this.metadata.example;
  }

  public validate(value: T): ValidationResult {
    return this.instance.validate(value);
  }
}

export class FieldTypeFactory {
  private readonly metadata: FieldTypeMetadata;

  public constructor(private readonly fieldTypeClass: SapphireFieldTypeClass) {
    this.metadata = getFieldTypeMetadataFromClass(fieldTypeClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get castTo(): 'string' | 'number' | 'boolean' {
    return this.metadata.castTo as 'string' | 'number' | 'boolean';
  }

  public get params(): UnknownParamDefs {
    return this.metadata.params;
  }

  public get example(): string | undefined {
    return this.metadata.example;
  }

  public instance(params: AnyParams): FieldType {
    return new FieldType(
        this.metadata,
        params as BuildParams<UnknownParamDefs>,
        new this.fieldTypeClass(params as BuildParams<UnknownParamDefs>));
  }
}
