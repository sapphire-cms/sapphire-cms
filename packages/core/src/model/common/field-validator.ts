import { AnyParams, AnyParamType, IValidator } from '../../common';
import { CapabilityReference } from '../../kernel';

export interface IFieldValidator<T extends AnyParamType | undefined = AnyParamType | undefined>
  extends IValidator<T> {
  ref: CapabilityReference;
  forTypes: ('string' | 'number' | 'boolean')[];
  params: AnyParams;
}
