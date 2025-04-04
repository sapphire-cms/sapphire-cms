import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldValidator} from '../../fields-validation';

@SapphireFieldValidator({
  name: 'required',
  forTypes: null,
  paramDefs: [] as const,
})
export class Required implements IValidator<string | number | boolean | null> {
  public validate(value: string | number | boolean | null): ValidationResult {
    return value
        ? ValidationResult.valid()
        : ValidationResult.invalid('Value is required');
  }
}
