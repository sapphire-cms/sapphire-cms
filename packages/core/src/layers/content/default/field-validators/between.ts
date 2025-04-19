import {IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldValidator} from '../../fields-validation';

@SapphireFieldValidator({
  name: 'between',
  forTypes: [ 'number' ] as const,
  params: [
    {
      name: 'min',
      description: 'Minimal value (inclusive).',
      type: 'number',
    },
    {
      name: 'max',
      description: 'Maximum value (inclusive).',
      type: 'number',
    },
  ] as const,
})
export class Between implements IValidator<number> {
  constructor(private readonly params: { min: number; max: number; }) {
  }

  public validate(value: number): ValidationResult {
    return value >= this.params.min && value <= this.params.max
        ? ValidationResult.valid()
        : ValidationResult.invalid(
            `Number ${value} should be between ${this.params.min} and ${this.params.max} (inclusive).`);
  }
}
