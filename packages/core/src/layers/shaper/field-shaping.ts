import { Outcome } from 'defectless';
import {
  AnyParams,
  AnyParamType,
  BuildParams,
  ParamDef,
  UnknownParamDefs,
  ValueType,
} from '../../common';
import { ShaperError } from '../../kernel';
import { FieldShaperMetadata, ITransformer, SapphireFieldShaperClass } from './field-shaping.types';

const FieldShaperRegistry = new WeakMap<SapphireFieldShaperClass, FieldShaperMetadata>();

export function SapphireFieldShaper<
  TForTypes extends ('string' | 'number' | 'boolean')[] | null = null, // null means all types
  TValueType extends ValueType<TForTypes> = ValueType<TForTypes>,
  TParamDefs extends readonly ParamDef[] = UnknownParamDefs,
  Output extends AnyParamType = AnyParamType,
>(config: {
  name: string;
  forTypes: TForTypes;
  params: TParamDefs;
}): <T extends new (params: BuildParams<TParamDefs>) => ITransformer<TValueType, Output>>(
  target: T,
) => void {
  return (target) => {
    FieldShaperRegistry.set(
      target as unknown as SapphireFieldShaperClass,
      config as unknown as FieldShaperMetadata,
    );
  };
}

function getFieldShaperMetadataFromClass<T extends SapphireFieldShaperClass>(
  target: T,
): FieldShaperMetadata | undefined {
  return FieldShaperRegistry.get(target);
}

export class FieldShaper<
  I extends AnyParamType = AnyParamType,
  O extends AnyParamType = AnyParamType,
> implements ITransformer<I, O>
{
  constructor(
    private readonly metadata: FieldShaperMetadata,
    public readonly params: AnyParams,
    private readonly instance: ITransformer<I, O>,
  ) {}

  public get name(): string {
    return this.metadata.name;
  }

  public get forTypes(): ('string' | 'number' | 'boolean')[] {
    return this.metadata.forTypes
      ? (this.metadata.forTypes as ('string' | 'number' | 'boolean')[])
      : ['string', 'number', 'boolean'];
  }

  public transform(input: I): Outcome<O, ShaperError> {
    return this.instance.transform(input);
  }
}

export class FieldShaperFactory {
  private readonly metadata: FieldShaperMetadata;

  constructor(private readonly fieldShaperClass: SapphireFieldShaperClass) {
    this.metadata = getFieldShaperMetadataFromClass(fieldShaperClass)!;
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

  public instance(params: AnyParams): FieldShaper {
    return new FieldShaper(
      this.metadata,
      params as BuildParams<UnknownParamDefs>,
      new this.fieldShaperClass(params as BuildParams<UnknownParamDefs>) as unknown as FieldShaper,
    );
  }
}
