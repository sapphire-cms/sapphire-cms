import { ValidationResult } from '../../common/validation';
import { parametrizedFieldTypeFactory, simpleFieldTypeFactory } from '../../model/field-type';
import { parametrizedFieldValidatorFactory } from '../../model/field-value-validation';
/* Type Factories */
const number = simpleFieldTypeFactory('number', 'number', (value) => {
    // TODO: code validation
    return ValidationResult.valid();
});
const tag = parametrizedFieldTypeFactory('tag', 'string', [
    {
        name: 'values',
        description: 'List of authorized values for the tag.',
        type: 'string',
        isList: true,
    },
    {
        name: 'multiple',
        description: 'Is it possible to select multiple tags',
        type: 'boolean',
        required: false,
    },
], ({ values, multiple }) => (value) => {
    // TODO: code validation
    value.split('|');
    return ValidationResult.valid();
});
/* Validator Factories */
const required = parametrizedFieldValidatorFactory('required', null, // for all types
[], () => (value) => {
    // TODO: code validation
    return ValidationResult.valid();
});
const integer = parametrizedFieldValidatorFactory('integer', ['number'], [], () => (value) => {
    let num;
    if (typeof value === 'number') {
        num = value;
    }
    else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            return ValidationResult.invalid(`Invalid number string: "${value}"`);
        }
        num = parsed;
    }
    else {
        return ValidationResult.invalid(`Unsupported type: ${typeof value}`);
    }
    return Number.isInteger(num)
        ? ValidationResult.valid()
        : ValidationResult.invalid(`Number ${num} is not an integer`);
});
const between = parametrizedFieldValidatorFactory('between', ['number'], [
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
], ({ min, max }) => (value) => {
    let num;
    if (typeof value === 'number') {
        num = value;
    }
    else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
            return ValidationResult.invalid(`Invalid number string: "${value}"`);
        }
        num = parsed;
    }
    else {
        return ValidationResult.invalid(`Unsupported type: ${typeof value}`);
    }
    return num >= min && num <= max
        ? ValidationResult.valid()
        : ValidationResult.invalid(`Number ${num} should be between ${min} and ${max} (inclusive).`);
});
const DefaultContentLayer = {
    fieldTypeFactories: [
        number,
        tag,
    ],
    fieldValueValidatorFactories: [
        required,
        integer,
        between,
    ],
};
export default DefaultContentLayer;
//# sourceMappingURL=default-content-layer.js.map