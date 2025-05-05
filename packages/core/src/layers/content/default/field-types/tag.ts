import { IValidator, ValidationResult } from '../../../../common';
import { SapphireFieldType } from '../../fields-typing';

const tagsPattern = /#[a-zA-Z0-9_-\s][^#]+/g;

@SapphireFieldType({
  name: 'tag',
  castTo: 'string',
  params: [
    {
      name: 'values',
      description: 'List of authorized tag values that can be assigned.',
      type: 'string',
      isList: true,
    },
    {
      name: 'multiple',
      description: 'Flag indicating whether a document can have multiple tags. Defaults to false.',
      type: 'boolean',
      required: false,
    },
  ] as const,
})
export class Tag implements IValidator<string> {
  constructor(private readonly params: { values: string[]; multiple: boolean }) {}

  public validate(value: string): ValidationResult {
    if (!value.length) {
      // No tags
      return ValidationResult.valid();
    }

    const matched = value.match(tagsPattern);

    if (!matched) {
      return ValidationResult.invalid(`Failed to parse tags from string: "${value}"`);
    }

    const tags = value.match(tagsPattern)!.map((tag) => tag.trim().slice(1));

    const errors: string[] = [];

    if (!this.params.multiple && tags.length > 1) {
      errors.push(
        'Multiple tags are forbidden for this field. Found tags: ' +
          tags.map((t) => `"${t}"`).join(', '),
      );
    }

    for (const tag of tags) {
      if (!this.params.values.includes(tag)) {
        errors.push(
          `Unknown tag: "${tag}". Supported tag values for the field: ` +
            this.params.values.map((t) => `"${t}"`).join(', '),
        );
      }
    }

    return errors.length ? ValidationResult.invalid(...errors) : ValidationResult.valid();
  }
}
