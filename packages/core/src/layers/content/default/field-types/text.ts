import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldType} from '../../fields-typing';

@SapphireFieldType({
  name: 'text',
  castTo: 'string',
  paramDefs: [] as const,
})
export class Text implements IValidator<string> {
  validate(value: string): ValidationResult {
    return ValidationResult.valid();
  }
}
