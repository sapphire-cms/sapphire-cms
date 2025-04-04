import {ValidationResult} from '../../common';
import {parametrizedFieldValidatorFactory} from './fields-validation';
import {ContentLayer} from './content.layer';
import {Id, Text, Number as NumberType, Tag} from './default/field-types';

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

export class DefaultContentLayer implements ContentLayer<void> {
  fieldTypeFactories = [
      Id,
      Text,
      NumberType,
      Tag,
  ];
  fieldValueValidatorFactories = [
      required,
      integer,
      between,
  ];
}
