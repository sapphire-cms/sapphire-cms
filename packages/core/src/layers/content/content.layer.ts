import {Layer} from '../../kernel';
import {FieldValueValidatorFactory} from './fields-validation.types';
import {SapphireFieldTypeClass} from './fields-typing.types';

export interface ContentLayer<Config> extends Layer<Config> {
  fieldTypeFactories?: SapphireFieldTypeClass<any, any>[];
  fieldValueValidatorFactories?: FieldValueValidatorFactory<any>[];
}
