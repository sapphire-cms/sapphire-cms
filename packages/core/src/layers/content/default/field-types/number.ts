import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldType} from '../../fields-typing';

@SapphireFieldType({
  name: 'number',
  castTo: 'number',
  paramDefs: [] as const,
})
export class Number implements IValidator<number> {
  validate(value: number): ValidationResult {
    return ValidationResult.valid();
  }
}
