import {IValidator} from '../../common';

export interface IFieldType<T extends string | number | boolean> extends IValidator<T> {
  name: string;
  castTo: 'string' | 'number' | 'boolean';
  params: any;
  example?: string;
}
