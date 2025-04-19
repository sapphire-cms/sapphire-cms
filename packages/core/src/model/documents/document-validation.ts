import {ValidationResult} from '../../common';
import {DocumentContent} from './document';

export type FieldsValidationResult<T extends DocumentContent> = {
  [K in keyof T]: ValidationResult;
};

export class ContentValidationResult<T extends DocumentContent> {
  public constructor(public readonly fields: FieldsValidationResult<T>) {
  }

  public get isValid(): boolean {
    return Object.values(this.fields).every(validationResult => validationResult.isValid);
  }
}

export type ContentValidator<T extends DocumentContent> = (content: T) => ContentValidationResult<T>;
