import { IValidator, ValidationResult } from '../../../../common';
import { SapphireFieldValidator } from '../../fields-validation';

@SapphireFieldValidator({
  name: 'positive',
  forTypes: ['number'] as const,
  params: [] as const,
})
export class Positive implements IValidator<number> {
  public validate(value: number): ValidationResult {
    return value > 0
      ? ValidationResult.valid()
      : ValidationResult.invalid(`Number ${value} should be positive.`);
  }
}
