import {ContentLayer} from './content.layer';
import {Id, Number, Tag, Text} from './default/field-types';
import {Between, Integer, Required} from './default/field-validators';

/**
 * TODO: remaining types to define
 *   CHECK = 'check',
 *   REFERENCE = 'reference',
 *   RICH_TEXT = 'rich-text',
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
      Tag,
  ];
  fieldValueValidatorFactories = [
      Required,
      Integer,
      Between,
  ];
}
