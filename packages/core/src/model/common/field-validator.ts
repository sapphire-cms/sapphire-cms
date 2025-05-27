import { AnyParams, IValidator } from '../../common';

export interface IFieldValidator<
  T extends ('string' | 'number' | 'boolean')[] = ('string' | 'number' | 'boolean')[],
> extends IValidator<T> {
  name: string;
  forTypes: ('string' | 'number' | 'boolean')[];
  params: AnyParams;
}
