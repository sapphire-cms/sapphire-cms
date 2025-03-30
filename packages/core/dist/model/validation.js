export class ValidationResult {
    errors;
    static valid() {
        return new ValidationResult();
    }
    constructor(errors = []) {
        this.errors = errors;
    }
    get isValid() {
        return !!this.errors.length;
    }
}
//# sourceMappingURL=validation.js.map