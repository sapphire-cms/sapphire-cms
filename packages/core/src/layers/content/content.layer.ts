import {Layer} from '../../kernel';
import {SapphireFieldValidatorClass} from './fields-validation.types';
import {SapphireFieldTypeClass} from './fields-typing.types';

export interface ContentLayer<Config> extends Layer<Config> {
  fieldTypeFactories?: SapphireFieldTypeClass<any, any>[];
  fieldValueValidatorFactories?: SapphireFieldValidatorClass<any, any, any>[];
}
