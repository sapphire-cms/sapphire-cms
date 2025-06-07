import { ValidationResult } from '../../common';
import { DocumentContent } from './document';

export type FieldsValidationResult<T extends DocumentContent = DocumentContent> = {
  [K in keyof T]: ValidationResult[]; // simple field contains one result, a list field one result per list item
};

export class ContentValidationResult<T extends DocumentContent = DocumentContent> {
  constructor(public readonly fields: FieldsValidationResult<T>) {}

  public get isValid(): boolean {
    return Object.values(this.fields)
      .flatMap((fieldResults) => fieldResults)
      .every((validationResult) => validationResult.isValid);
  }
}

export type ContentValidator<T extends DocumentContent = DocumentContent> = (
  content: T,
) => ContentValidationResult<T>;
