import { IValidator, ValidationResult } from '../../../../common';
import { DocumentReference, docRefValidator } from '../../../../model';
import { SapphireFieldType } from '../../fields-typing';

@SapphireFieldType({
  name: 'media',
  castTo: 'string',
  params: [] as const,
})
export class Media implements IValidator<string> {
  public validate(value: string): ValidationResult {
    const validationRes = docRefValidator(value);
    if (!validationRes.isValid) {
      return validationRes;
    }

    const ref = DocumentReference.parse(value);

    const err: string[] = [];

    if (ref.store != 'cms-media') {
      err.push("Media reference should point on hidden collection 'cms-media'.");
    }

    if (!ref.docId) {
      err.push("Media reference should point to the document inside a collection 'cms-media'.");
    }

    return err.length ? ValidationResult.invalid(...err) : ValidationResult.valid();
  }
}
