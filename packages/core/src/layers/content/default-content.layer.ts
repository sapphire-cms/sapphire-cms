import { ContentLayer } from './content.layer';
import {
  Between,
  Check,
  Group,
  Integer,
  Number,
  Reference,
  Required,
  RichText,
  Tag,
  Text,
} from './default';

/**
 * TODO: remaining types to define
 *   LOCAL_DATE = 'local-date',
 *   LOCAL_TIME = 'local-time',
 *   ISO_DATE_TIME = 'iso-date-time',
 *   URL = 'url
 *   MEDIA = 'media',
 */
export class DefaultContentLayer implements ContentLayer {
  public readonly fieldTypeFactories = [Text, Number, Check, Tag, RichText, Reference, Group];
  public readonly fieldValueValidatorFactories = [Required, Integer, Between];
}
