import {ContentLayer} from './content.layer';
import {Between, Check, Group, Id, Integer, Number, Reference, Required, RichText, Tag, Text} from './default';

/**
 * TODO: remaining types to define
 *   LOCAL_DATE = 'local-date',
 *   LOCAL_TIME = 'local-time',
 *   ISO_DATE_TIME = 'iso-date-time',
 *   URL = 'url
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
      Reference,
      Group,
  ];
  fieldValueValidatorFactories = [
      Required,
      Integer,
      Between,
  ];
}
