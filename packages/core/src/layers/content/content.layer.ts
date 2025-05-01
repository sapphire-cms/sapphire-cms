import {AnyParams} from '../../common';
import {Layer} from '../../kernel';
import {AnySapphireFieldTypeClass} from './fields-typing.types';
import {AnySapphireFieldValidatorClass} from './fields-validation.types';

export interface ContentLayer<Config extends AnyParams | undefined = undefined> extends Layer<Config> {
  fieldTypeFactories?: AnySapphireFieldTypeClass[];
  fieldValueValidatorFactories?: AnySapphireFieldValidatorClass[];
}
