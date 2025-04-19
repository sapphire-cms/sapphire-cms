import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldValidator} from '../../fields-validation';

@SapphireFieldValidator({
  name: 'required',
  forTypes: null,
  params: [] as const,
})
export class Required implements IValidator<string | number | boolean | null> {
  public validate(value: string | number | boolean | null): ValidationResult {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed.length) {
        return ValidationResult.invalid('Value is required');
      }
    }

    return value != null
        ? ValidationResult.valid()
        : ValidationResult.invalid('Value is required');
  }
}
