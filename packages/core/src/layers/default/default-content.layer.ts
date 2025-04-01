import {ContentLayer} from '../content.layer';
import {ValidationResult} from '../../common/validation';
import {parametrizedFieldTypeFactory, simpleFieldTypeFactory} from '../../model/field-type';
import {parametrizedFieldValidatorFactory} from '../../model/field-value-validation';
import {idValidator} from '../../common/ids';

/* Type Factories */

const id = simpleFieldTypeFactory('id', 'string', idValidator);

const text = simpleFieldTypeFactory('text', 'string');

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
      if (!value.length) {
        // No tags
        return ValidationResult.valid();
      }

      const tagsPattern = /#[a-zA-Z0-9_-\s][^#]+/g
      const matched = value.match(tagsPattern);

      if (!matched) {
        return ValidationResult.invalid(
            `Failed to parse tags from string: "${value}"`);
      }

      const tags = value
          .match(tagsPattern)!
          .map(tag => tag.trim().slice(1));

      const errors: string[] = [];

      if (!multiple && tags.length > 1) {
        errors.push(
            'Multiple tags are forbidden for this field. Found tags: '
            + tags.map(t => `"${t}"`).join(', ')
        );
      }

      for (const tag of tags) {
        if (!values.includes(tag)) {
          errors.push(
              `Unknown tag: "${tag}". Supported tag values for the field: `
              + values.map(t => `"${t}"`).join(', ')
          );
        }
      }

      return errors.length
          ? ValidationResult.invalid(...errors)
          : ValidationResult.valid();
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
      text,
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
