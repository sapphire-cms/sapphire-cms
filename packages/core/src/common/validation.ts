export class ValidationResult {
  public static valid(): ValidationResult {
    return new ValidationResult();
  }

  public static invalid(...errors: string[]): ValidationResult {
    return new ValidationResult(errors);
  }

  private constructor(public readonly errors: string[] = []) {}

  public get isValid(): boolean {
    return this.errors.length === 0;
  }
}

export type Validator<T> = (value: T) => ValidationResult;

export interface IValidator<T> {
  validate: Validator<T>;
}
