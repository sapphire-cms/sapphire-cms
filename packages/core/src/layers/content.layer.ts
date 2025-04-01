import {FieldTypeFactory} from '../model/field-type';
import {FieldValueValidatorFactory} from '../model/field-value-validation';
import {Layer} from './layer';

export interface ContentLayer<Config> extends Layer<Config> {
  fieldTypeFactories?: FieldTypeFactory<any, any>[];
  fieldValueValidatorFactories?: FieldValueValidatorFactory<any>[];
}
