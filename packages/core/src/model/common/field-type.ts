import { AnyParams, AnyParamType, IValidator } from '../../common';
import { ModuleReference } from '../../kernel';

export interface IFieldType<T extends AnyParamType = AnyParamType> extends IValidator<T> {
  ref: ModuleReference;
  castTo: 'string' | 'number' | 'boolean';
  params: AnyParams;
  example?: string;
}
