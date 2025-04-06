import {TextForm, TextFormField} from './textform.types';

/**
 * Presents the form as text.
 */
export function present(form: TextForm): string {
  let text = '';

  if (form.banner) {
    text += renderBanner(form.banner) + '\n\n';
  }

  for (const field of form.fields) {
    text += renderField(field);
  }

  return text;
}

function renderBanner(banner: string): string {
  return banner
      .split('\n')
      .map(line => '% ' + line)
      .join('\n');
}

function renderField(field: TextFormField) {
  let text = '%%\n';  // start with anchor

  const requiredMarker = field.commentBlock?.isRequired ? '*' : ' ';
  const label = field.commentBlock?.label || field.name;
  const fieldType = field.commentBlock?.declaredType || field.type;

  text += `% ${requiredMarker} ${label} (type: ${fieldType})\n`;

  if (field.commentBlock?.description) {
    text += `%   ${field.commentBlock?.description}\n`;
  }

  if (field.commentBlock?.example) {
    text += `%   Example: ${field.commentBlock?.example}\n`;
  }

  for (const note of field.commentBlock?.notes || []) {
    text += `%   Note: ${note}\n`;
  }

  for (const err of field.commentBlock?.errors || []) {
    text += `% !Error!: ${err}\n`;
  }

  text += `\n`; // empty line before the first value

  if (!field.values || field.values.length === 0) {
    text += field.commentBlock?.example || `\n`;
  } else {
    text += field.values
        .map(value => field.type === 'boolean'
            ? renderBoolean(value as boolean)
            : value)
        .join('\n\n===\n\n'); // list values splitter
  }

  text += `\n\n`; // empty line after the last value

  return text;
}

function renderBoolean(bool: boolean): string {
  return '[' + (bool ? 'X' : ' ') + ']';
}
