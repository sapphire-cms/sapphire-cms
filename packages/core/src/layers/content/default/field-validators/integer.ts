import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldValidator} from '../../fields-validation';

@SapphireFieldValidator({
  name: 'integer',
  forTypes: [ 'number' ] as const,
  params: [] as const,
})
export class Integer implements IValidator<number> {
  public validate(value: number): ValidationResult {
    return Number.isInteger(value)
        ? ValidationResult.valid()
        : ValidationResult.invalid(`Number ${value} is not an integer`);
  }
}
