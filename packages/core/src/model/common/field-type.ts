import { AnyParams, AnyParamType, IValidator } from '../../common';
import { CapabilityReference } from '../../kernel';

export interface IFieldType<T extends AnyParamType = AnyParamType> extends IValidator<T> {
  ref: CapabilityReference;
  castTo: 'string' | 'number' | 'boolean';
  params: AnyParams;
  example?: string;
}
