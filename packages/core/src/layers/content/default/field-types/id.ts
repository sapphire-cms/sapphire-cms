import {idValidator, IValidator, ValidationResult} from '../../../../common';
import {SapphireFieldType} from '../../fields-typing';

@SapphireFieldType({
  name: 'id',
  castTo: 'string',
  paramDefs: [] as const,
})
export class Id implements IValidator<string> {
  validate(value: string): ValidationResult {
    return idValidator(value);
  }
}
