import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldType} from '../../fields-typing';

@SapphireFieldType({
  name: 'check',
  castTo: 'boolean',
  params: [] as const,
})
export class Check implements IValidator<boolean> {
  public validate(_value: boolean): ValidationResult {
    return ValidationResult.valid();
  }
}
