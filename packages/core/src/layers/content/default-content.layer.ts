import {ContentLayer} from './content.layer';
import {Check, Id, Number, RichText, Tag, Text} from './default/field-types';
import {Between, Integer, Required} from './default/field-validators';

/**
 * TODO: remaining types to define
 *   REFERENCE = 'reference',
 *   LOCAL_DATE = 'local-date',
 *   LOCAL_TIME = 'local-time',
 *   ISO_DATE_TIME = 'iso-date-time',
 *   MEDIA = 'media',
 */
export class DefaultContentLayer implements ContentLayer<void> {
  fieldTypeFactories = [
      Id,
      Text,
      Number,
      Check,
      Tag,
      RichText,
  ];
  fieldValueValidatorFactories = [
      Required,
      Integer,
      Between,
  ];
}
