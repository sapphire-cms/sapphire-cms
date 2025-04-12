import {SapphireFieldType} from '../../fields-typing';
import {DocumentReference, IValidator, refValidator, ValidationResult} from '../../../../common';

@SapphireFieldType({
  name: 'reference',
  castTo: 'string',
  example: 'docs/core/field-types/tag:ru',
  paramDefs: [
    {
      name: 'store',
      description: 'Authorized store for the reference.',
      type: 'string',
    }
  ] as const,
})
export class Reference implements IValidator<string> {
  constructor(private readonly params: { store: string; }) {
  }

  validate(value: string): ValidationResult {
    const validationRes = refValidator(value);
    if (!validationRes.isValid) {
      return validationRes;
    }

    const ref = DocumentReference.parse(value);
    return ref.store === this.params.store
        ? ValidationResult.valid()
        : ValidationResult.invalid(`Reference point on the store ${ref.store} that is not authorized to this field.`);
  }
}
