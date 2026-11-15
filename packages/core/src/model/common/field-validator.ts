import { AnyParams, AnyParamType, IValidator } from '../../common';
import { ModuleReference } from '../../kernel';

export interface IFieldValidator<T extends AnyParamType | undefined = AnyParamType | undefined>
  extends IValidator<T> {
  ref: ModuleReference;
  forTypes: ('string' | 'number' | 'boolean')[];
  params: AnyParams;
}
