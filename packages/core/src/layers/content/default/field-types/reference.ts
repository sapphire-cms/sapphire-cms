import { IValidator, ValidationResult } from '../../../../common';
import { DocumentReference, refValidator } from '../../../../model';
import { SapphireFieldType } from '../../fields-typing';

@SapphireFieldType({
  name: 'reference',
  castTo: 'string',
  example: 'docs/core/field-types/tag:ru',
  params: [
    {
      name: 'store',
      description: 'Authorized store for the reference.',
      type: 'string',
    },
  ] as const,
})
export class Reference implements IValidator<string> {
  constructor(private readonly params: { store: string }) {}

  public validate(value: string): ValidationResult {
    const validationRes = refValidator(value);
    if (!validationRes.isValid) {
      return validationRes;
    }

    const ref = DocumentReference.parse(value);
    return ref.store === this.params.store
      ? ValidationResult.valid()
      : ValidationResult.invalid(
          `Reference point on the store ${ref.store} that is not authorized to this field.`,
        );
  }
}
