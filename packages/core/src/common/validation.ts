export class ValidationResult {
  public static valid(): ValidationResult {
    return new ValidationResult();
  }

  public static invalid(...errors: string[]): ValidationResult {
    return new ValidationResult(errors);
  }

  private constructor(public readonly errors: string[] = []) {
  }

  public get isValid(): boolean {
    return !!this.errors.length;
  }
}

export type Validator<T> = (value: T) => ValidationResult;
