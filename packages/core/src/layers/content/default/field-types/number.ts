import { IValidator, ValidationResult } from '../../../../common';
import { SapphireFieldType } from '../../fields-typing';

@SapphireFieldType({
  name: 'number',
  castTo: 'number',
  indexable: true,
  example: '42',
  params: [] as const,
})
export class Number implements IValidator<number> {
  public validate(_value: number): ValidationResult {
    return ValidationResult.valid();
  }
}
