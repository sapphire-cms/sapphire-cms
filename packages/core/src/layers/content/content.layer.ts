import {Layer} from '../../kernel';
import {FieldTypeFactory, FieldValueValidatorFactory} from './content.types';

export interface ContentLayer<Config> extends Layer<Config> {
  fieldTypeFactories?: FieldTypeFactory<any, any>[];
  fieldValueValidatorFactories?: FieldValueValidatorFactory<any>[];
}
