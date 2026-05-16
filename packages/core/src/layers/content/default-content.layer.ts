import { ContentLayer } from './content.layer';
import {
  Between,
  Check,
  Group,
  Integer,
  Media,
  Number,
  Positive,
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
 */
export class DefaultContentLayer implements ContentLayer {
  public readonly fieldTypeFactories = [
    Text,
    Number,
    Check,
    Tag,
    RichText,
    Reference,
    Group,
    Media,
  ];
  public readonly fieldValueValidatorFactories = [Required, Integer, Positive, Between];
}
