import {ContentLayer} from './content.layer';
import {Id, Number, Tag, Text} from './default/field-types';
import {Between, Integer, Required} from './default/field-validators';

export class DefaultContentLayer implements ContentLayer<void> {
  fieldTypeFactories = [
      Id,
      Text,
      Number,
      Tag,
  ];
  fieldValueValidatorFactories = [
      Required,
      Integer,
      Between,
  ];
}
