import {FieldTypeFactory} from '../model/field-type';
import {FieldValueValidatorFactory} from '../model/field-value-validation';

export type ContentLayer = {
  fieldTypeFactories?: FieldTypeFactory<any, any>[];
  fieldValueValidatorFactories?: FieldValueValidatorFactory<any>[];
}
