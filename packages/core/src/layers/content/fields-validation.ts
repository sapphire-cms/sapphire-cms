import {
  AnyParams,
  AnyParamType,
  asId,
  BuildParams,
  IValidator,
  MapTypeArray,
  ParamDef,
  UnknownParamDefs,
  ValidationResult,
} from '../../common';
import { ModuleReference } from '../../kernel';
import { IFieldValidator } from '../../model';
import { FieldValidatorMetadata, SapphireFieldValidatorClass } from './fields-validation.types';

const FieldValidatorRegistry = new WeakMap<SapphireFieldValidatorClass, FieldValidatorMetadata>();

export function SapphireFieldValidator<
  TForTypes extends ('string' | 'number' | 'boolean')[] = [],
  TValueType extends MapTypeArray<TForTypes> = MapTypeArray<TForTypes>,
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

export class FieldValidator<T extends AnyParamType | undefined = AnyParamType | undefined>
  implements IFieldValidator<T>
{
  constructor(
    private readonly moduleRef: ModuleReference,
    private readonly metadata: FieldValidatorMetadata,
    public readonly params: AnyParams,
    private readonly instance: IFieldValidator<T>,
  ) {}

  public get ref(): ModuleReference {
    return this.moduleRef.withCapability(asId(this.metadata.name));
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

  constructor(
    private readonly moduleRef: ModuleReference,
    private readonly fieldValidatorClass: SapphireFieldValidatorClass,
  ) {
    this.metadata = getFieldValidatorMetadataFromClass(fieldValidatorClass)!;
  }

  public get ref(): ModuleReference {
    return this.moduleRef.withCapability(asId(this.metadata.name));
  }

  public get forTypes(): ('string' | 'number' | 'boolean')[] {
    return this.metadata.forTypes
      ? (this.metadata.forTypes as ('string' | 'number' | 'boolean')[])
      : ['string', 'number', 'boolean'];
  }

  public get params(): UnknownParamDefs {
    return this.metadata.params;
  }

  public instance(params: AnyParams): FieldValidator {
    return new FieldValidator(
      this.moduleRef,
      this.metadata,
      params as BuildParams<UnknownParamDefs>,
      new this.fieldValidatorClass(
        params as BuildParams<UnknownParamDefs>,
      ) as unknown as FieldValidator,
    );
  }
}
