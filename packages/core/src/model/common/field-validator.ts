import { AnyParams, AnyParamType, IValidator } from '../../common';

export interface IFieldValidator<T extends AnyParamType = AnyParamType> extends IValidator<T> {
  name: string;
  forTypes: ('string' | 'number' | 'boolean')[];
  params: AnyParams;
}
