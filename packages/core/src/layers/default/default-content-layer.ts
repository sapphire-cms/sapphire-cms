import {ContentLayer} from '../content-layer';
import {ValidationResult} from '../../common/validation';
import {parametrizedFieldTypeFactory, simpleFieldTypeFactory} from '../../model/field-type';
import {parametrizedFieldValidatorFactory} from '../../model/field-value-validation';

/* Type Factories */

const id = simpleFieldTypeFactory(
    'id',
    'string',
    (value: string) => {
      /**
       * Validation rules of IDs:
       * - Only use a-z, 0-9, and - or _
       * - No spaces
       * - No uppercase
       * - No leading digits
       * - Length limit: 64 characters
       * - No special characters
       * - No trailing hyphens/underscores
       */

      const idPattern = /^(?![-_\d])[a-z\d]+([-_][a-z\d]+)*$/;
      return value.length <= 64 && idPattern.test(value)
          ? ValidationResult.valid()
          : ValidationResult.invalid(`Invalid ID string: "${value}"`);
    }
);

const number = simpleFieldTypeFactory(
    'number',
    'number',
    (value: number) => {
      // TODO: code validation
      return ValidationResult.valid();
    }
);

const tag = parametrizedFieldTypeFactory(
    'tag',
    'string',
    [
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
    ] as const,
    ({ values, multiple }: { values: string[]; multiple: boolean; }) => (value: string) => {
      // TODO: code validation
      value.split('|');
      return ValidationResult.valid();
    }
);

/* Validator Factories */

const required = parametrizedFieldValidatorFactory(
    'required',
    null,   // for all types
    [],
    () => (value: string | number | boolean | null) => {
      // TODO: code validation
      return ValidationResult.valid();
    }
);

const integer = parametrizedFieldValidatorFactory(
    'integer',
    [ 'number' ] as const,
    [],
    () => (value: number) => {
      let num: number;

      if (typeof value === 'number') {
        num = value;
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          return ValidationResult.invalid(`Invalid number string: "${value}"`);
        }
        num = parsed;
      } else {
        return ValidationResult.invalid(`Unsupported type: ${typeof value}`);
      }

      return Number.isInteger(num)
          ? ValidationResult.valid()
          : ValidationResult.invalid(`Number ${num} is not an integer`);
    }
);

const between = parametrizedFieldValidatorFactory(
    'between',
    [ 'number' ] as const,
    [
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
    ] as const,
    ({ min, max }: { min: number; max: number; }) => (value: number) => {
      let num: number;

      if (typeof value === 'number') {
        num = value;
      } else if (typeof value === 'string') {
        const parsed = parseFloat(value);
        if (isNaN(parsed)) {
          return ValidationResult.invalid(`Invalid number string: "${value}"`);
        }
        num = parsed;
      } else {
        return ValidationResult.invalid(`Unsupported type: ${typeof value}`);
      }

      return num >= min && num <= max
          ? ValidationResult.valid()
          : ValidationResult.invalid(`Number ${num} should be between ${min} and ${max} (inclusive).`);
    }
);

const DefaultContentLayer: ContentLayer = {
  fieldTypeFactories: [
    id,
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
