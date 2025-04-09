import {ContentLayer} from './content.layer';
import {Between, Check, Id, Integer, Number, Required, RichText, Tag, Text} from './default';

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
