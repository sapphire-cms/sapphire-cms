import {
  AnyParams,
  AnyParamType,
  BuildParams,
  IValidator,
  ParamDef,
  UnknownParamDefs,
  ValidationResult,
} from '../../common';
import { IFieldValidator } from '../../model';
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

function getFieldValidatorMetadataFromClass<T extends SapphireFieldValidatorClass>(
  target: T,
): FieldValidatorMetadata | undefined {
  return FieldValidatorRegistry.get(target);
}

export class FieldValidator<T extends AnyParamType = AnyParamType> implements IFieldValidator<T> {
  constructor(
    private readonly metadata: FieldValidatorMetadata,
    public readonly params: AnyParams,
    private readonly instance: IFieldValidator<T>,
  ) {}

  public get name(): string {
    return this.metadata.name;
  }

  public get forTypes(): ('string' | 'number' | 'boolean')[] {
    return this.metadata.forTypes
      ? (this.metadata.forTypes as ('string' | 'number' | 'boolean')[])
      : ['string', 'number', 'boolean'];
  }

  public validate(value: T): ValidationResult {
    return this.instance.validate(value);
  }
}

export class FieldValidatorFactory {
  private readonly metadata: FieldValidatorMetadata;

  constructor(private readonly fieldValidatorClass: SapphireFieldValidatorClass) {
    this.metadata = getFieldValidatorMetadataFromClass(fieldValidatorClass)!;
  }

  public get name(): string {
    return this.metadata.name;
  }

  public get forTypes(): ('string' | 'number' | 'boolean')[] | null {
    return this.metadata.forTypes
      ? (this.metadata.forTypes as ('string' | 'number' | 'boolean')[])
      : ['string', 'number', 'boolean'];
  }

  public get params(): UnknownParamDefs {
    return this.metadata.params;
  }

  public instance(params: AnyParams): FieldValidator {
    return new FieldValidator(
      this.metadata,
      params as BuildParams<UnknownParamDefs>,
      new this.fieldValidatorClass(
        params as BuildParams<UnknownParamDefs>,
      ) as unknown as FieldValidator,
    );
  }
}
