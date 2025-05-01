import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldType} from '../../fields-typing';

@SapphireFieldType({
  name: 'rich-text',
  castTo: 'string',
  example: 'Edited with **Sapphire CMS**!',
  params: [] as const,
})
export class RichText implements IValidator<string> {
  public validate(_value: string): ValidationResult {
    return ValidationResult.valid();
  }
}
