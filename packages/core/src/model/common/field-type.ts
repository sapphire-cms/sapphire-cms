import { AnyParams, AnyParamType, IValidator } from '../../common';

export interface IFieldType<T extends AnyParamType = AnyParamType> extends IValidator<T> {
  name: string;
  castTo: 'string' | 'number' | 'boolean';
  params: AnyParams;
  example?: string;
}
